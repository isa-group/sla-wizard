var fs = require('fs');
var path = require('path');
var jsyaml = require('js-yaml');
var url = require("url");
var axios = require("axios");
var configs = require("./configs");
var utils = require("./utils");


/**
 * Receives an SLA agreement and produces (as string) a Envoy dynamic config file
 * according to the rate limiting it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 * @param {string} apiServerURL - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
 * @param {string} authLocation - Where to look for the authentication parameter: 'header','query' or 'url'
 * @param {string} authName - Name of the authentication parameter, such as "token" or "apikey".
 * @param {string} proxyPort - Port on which the proxy is running.
 */
function generateEnvoyConfig(SLAs, oasDoc, apiServerURL, configTemplatePath, authLocation, authName, proxyPort) {

    if (configTemplatePath == null) {
        configTemplatePath = path.join(__dirname, '../templates/envoy.yaml');
    }
    var envoyTemplate = jsyaml.load(utils.getProxyConfigTemplate(configTemplatePath));
    var routesDefinition = [];
    var limitedPaths = [];
    var allProxyApikeys = [];
    var apikeysAtTheEndOfURL = "";
    var paramsCount;
    var endpoint_paramsRegexd;
    var matcher;
    apiServerURL = url.parse(apiServerURL)

    for (var subSLA of SLAs) {
        var subSLARates = subSLA["plan"]["rates"];
        var slaApikeys = subSLA["context"]["apikeys"]
        allProxyApikeys = allProxyApikeys.concat(slaApikeys);
        var rl_translation = true;

        for (var endpoint in subSLARates) {
            limitedPaths.indexOf(endpoint) === -1 ? limitedPaths.push(endpoint) : {};

            for (var method in subSLARates[endpoint]) {
                var method_specs = subSLARates[endpoint][method];
                var max = method_specs["requests"][0]["max"];

                // Rate Limiting translation is applied here
                var period;
                if (rl_translation == true) {
                    period = parseInt(utils.getLimitPeriod(method_specs["requests"][0]["period"], "envoy_translate"), 10) / max;
                    var new_period = period;
                    var new_max = 1;
                    while (new_period < 50) {
                        new_period += period;
                        new_max++;
                    }
                    period = (new_period / 1000).toFixed(9) + "s"; // convert ms to seconds (note Envoy takes up to 9 decimals but not more)
                    max = new_max;
                } else {
                    period = utils.getLimitPeriod(method_specs["requests"][0]["period"], "envoy");
                }

                paramsCount = (endpoint.match(/{/g) || []).length;
                endpoint_paramsRegexd = endpoint.replace(/(\/{(.*?)\})+/g, `(?:\\/[^/]+){${paramsCount}}`); // If the endpoint has parameters these are regex'd

                for (var i in slaApikeys) {

                    matcher = {
                        "match": {
                            "headers": [{
                                "name": ":method",
                                "string_match": {
                                    "exact": method.toUpperCase()
                                }
                            }]
                        },
                        "route": {
                            "cluster": "main-cluster" // If authLocation is url, this is later modified
                        },
                        "typed_per_filter_config": {
                            "envoy.filters.http.local_ratelimit": {
                                "@type": "type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit",
                                "stat_prefix": "route_rate_limit",
                                "token_bucket": {
                                    "max_tokens": max,
                                    "tokens_per_fill": max,
                                    "fill_interval": period
                                },
                                "filter_enabled": {
                                    "runtime_key": "route_limit_enabled",
                                    "default_value": {
                                        "numerator": 100,
                                        "denominator": "HUNDRED"
                                    }
                                },
                                "filter_enforced": {
                                    "runtime_key": "route_limit_enforced",
                                    "default_value": {
                                        "numerator": 100,
                                        "denominator": "HUNDRED"
                                    }
                                }
                            }
                        }
                    };

                    var authCheck = {
                        "name": authName,
                        "string_match": {
                            "exact": slaApikeys[i]
                        }
                    };

                    if (authLocation == "header") {
                        matcher["match"]["headers"].push(authCheck);
                    } else if (authLocation == "query") {
                        matcher["match"]["query_parameters"] = [];
                        matcher["match"]["query_parameters"].push(authCheck);
                    } else if (authLocation == "url") {
                        apikeysAtTheEndOfURL = `/${slaApikeys[i]}`; // The variable apikeysAtTheEndOfURL will be '' if authLocation is header or query
                        matcher["route"] = {
                            "cluster": "main-cluster",
                            "regex_rewrite": {
                                "pattern": {
                                    "google_re2": null,
                                    "regex": `(.*)/${slaApikeys[i]}$`
                                },
                                "substitution": "\\1"
                            }
                        };
                    }

                    if (paramsCount == 0) {
                        matcher["match"]["path"] = `${endpoint}${apikeysAtTheEndOfURL}`;
                    } else {
                        matcher["match"]["safe_regex"] = {
                            "google_re2": null,
                            "regex": `^${endpoint_paramsRegexd}${apikeysAtTheEndOfURL}$`
                        }
                    }
                    routesDefinition.push(matcher);
                }
            }
        }
    }

    var allProxyApikeysJoined = allProxyApikeys.join('|');
    if (limitedPaths.length != Object.keys(oasDoc.paths).length) { // "ratelimiting-less" endpoints management
        for (var endpoint in oasDoc.paths) {
            var methods = Object.keys(oasDoc.paths[endpoint]).join('|').toUpperCase();
            if (!limitedPaths.includes(endpoint)) {
                for (var method in oasDoc.paths[endpoint]) {

                    paramsCount = (endpoint.match(/{/g) || []).length;
                    endpoint_paramsRegexd = endpoint.replace(/(\/{(.*?)\})+/g, `(?:\\/[^/]+){${paramsCount}}`); // If the endpoint has parameters these are regex'd

                    matcher = {
                        "match": {
                            "headers": [{
                                "name": ":method",
                                "string_match": {
                                    "safe_regex": {
                                        "google_re2": null,
                                        "regex": `^(${methods})$`
                                    }
                                }
                            }]
                        },
                        "route": {
                            "cluster": "main-cluster"
                        }
                    };

                    if (authLocation == "header") {
                        matcher["match"]["headers"].push({
                            "name": authName,
                            "string_match": {
                                "safe_regex": {
                                    "google_re2": null,
                                    "regex": `^(${allProxyApikeys.join('|')})$`
                                }
                            }
                        });
                    } else if (authLocation == "query") { // For free endpoints, all the apikeys are added to a single string_match, hence using safe_regex instead exact
                        matcher["match"]["query_parameters"] = [];
                        matcher["match"]["query_parameters"].push({
                            "name": authName,
                            "string_match": {
                                "safe_regex": {
                                    "google_re2": null,
                                    "regex": `^(${allProxyApikeys.join('|')})$`
                                }
                            }
                        });
                    } else if (authLocation == "url") {
                        apikeysAtTheEndOfURL = `/(${allProxyApikeys.join('|')})`; // The variable apikeysAtTheEndOfURL will be '' if authLocation is header or query
                        matcher["route"] = {
                            "cluster": "main-cluster",
                            "regex_rewrite": {
                                "pattern": {
                                    "google_re2": null,
                                    "regex": `(.*)/(${allProxyApikeys.join('|')})$`
                                },
                                "substitution": "\\1"
                            }
                        };
                    }

                    if (paramsCount == 0 && authLocation != "url") {
                        matcher["match"]["path"] = `${endpoint}${apikeysAtTheEndOfURL}`;
                    } else {
                        matcher["match"]["safe_regex"] = {
                            "google_re2": null,
                            "regex": `^${endpoint_paramsRegexd}${apikeysAtTheEndOfURL}$`
                        }
                    }
                    routesDefinition.push(matcher);
                }
            }
        }
    }

    envoyTemplate.layered_runtime.layers[0].static_layer.re2.max_program_size.error_level = allProxyApikeysJoined.length + 50 // equivalent to max_program_size
    envoyTemplate.static_resources
        .listeners[0].address.socket_address.port_value = proxyPort
    envoyTemplate.static_resources
        .listeners[0].filter_chains[0].filters[0]
        .typed_config.route_config.virtual_hosts[0].routes = routesDefinition
    envoyTemplate.static_resources
        .listeners[0].filter_chains[0].filters[0]
        .typed_config.access_log[0].typed_config.format = `[%START_TIME%] "%REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %REQ(${authName})% %PROTOCOL%" %RESPONSE_CODE% %RESPONSE_FLAGS% \n`
    envoyTemplate.static_resources
        .clusters[0].load_assignment.endpoints[0].lb_endpoints[0]
        .endpoint.address.socket_address.address = apiServerURL.hostname
    envoyTemplate.static_resources
        .clusters[0].load_assignment.endpoints[0].lb_endpoints[0]
        .endpoint.address.socket_address.port_value = apiServerURL.port
    return jsyaml.dump(envoyTemplate, {
        lineWidth: -1
    })
}


/**
 * Receives an SLA agreement and produces (as string) a Traefik dynamic config file
 * according to the rate limiting it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 * @param {string} apiServerURL - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
 * @param {string} authLocation - Where to look for the authentication parameter: 'header','query' or 'url'
 * @param {string} authName - Name of the authentication parameter, such as "token" or "apikey".
 */
function generateTraefikConfig(SLAs, oasDoc, apiServerURL, configTemplatePath, authLocation, authName) {

    if (configTemplatePath == null) {
        configTemplatePath = path.join(__dirname, '../templates/traefik.yaml');
    }
    var traefikTemplate = jsyaml.load(utils.getProxyConfigTemplate(configTemplatePath));
    var routersDefinition = {};
    var middlewaresDefinition = {};
    var limitedPaths = [];
    var allProxyApikeys = [];
    var sanitized_endpoint;

    for (var subSLA of SLAs) {
        var planName = subSLA["plan"]["name"];
        var subSLARates = subSLA["plan"]["rates"];
        var slaApikeys = subSLA["context"]["apikeys"]
        var slaContextID = subSLA["context"]["id"]
        allProxyApikeys = allProxyApikeys.concat(slaApikeys);

        for (var endpoint in subSLARates) {
            limitedPaths.indexOf(endpoint) === -1 ? limitedPaths.push(endpoint) : {};
            sanitized_endpoint = utils.sanitizeEndpoint(endpoint);

            for (var method in subSLARates[endpoint]) {
                var method_specs = subSLARates[endpoint][method];
                var max = method_specs["requests"][0]["max"];
                var period = utils.getLimitPeriod(method_specs["requests"][0]["period"], "traefik");

                for (var i in slaApikeys) {
                    if (authLocation == "query") {
                        routersDefinition[`${slaContextID}_${planName}_${sanitized_endpoint}_ak${i}_${method}`] = {
                            rule: `Path(\`${endpoint}\`) && Method(\`${method.toUpperCase()}\`) && Query(\`${authName}=${slaApikeys[i]}\`)`,
                            service: "main-service",
                            middlewares: [`${planName}_addApikeyHeader_ak${i}`,
                                `${slaContextID}_${planName}_${sanitized_endpoint}_${method}`
                            ]
                        }
                    } else if (authLocation == "url") {
                        routersDefinition[`${slaContextID}_${planName}_${sanitized_endpoint}_ak${i}_${method}`] = {
                            rule: `Path(\`${endpoint}/${slaApikeys[i]}\`) && Method(\`${method.toUpperCase()}\`)`,
                            service: "main-service",
                            middlewares: ["removeApikeyFromURL",
                                `${planName}_addApikeyHeader_ak${i}`,
                                `${slaContextID}_${planName}_${sanitized_endpoint}_${method}`
                            ]
                        }
                    } else if (authLocation == "header") { // only 1 iteration needed in this case, hence the 'break'
                        routersDefinition[`${slaContextID}_${planName}_${sanitized_endpoint}_${method}`] = {
                            rule: `Path(\`${endpoint}\`) && Method(\`${method.toUpperCase()}\`) && HeadersRegexp(\`${authName}\`, \`${slaApikeys.join('|')}\`)`,
                            service: "main-service",
                            middlewares: [`${slaContextID}_${planName}_${sanitized_endpoint}_${method}`]
                        }
                        break;
                    }

                    middlewaresDefinition[`${planName}_addApikeyHeader_ak${i}`] = { // This one is not added for authLocation 'header'
                        headers: {
                            customRequestHeaders: {
                                [authName]: slaApikeys[i]
                            }
                        }
                    }
                }

                middlewaresDefinition[`${slaContextID}_${planName}_${sanitized_endpoint}_${method}`] = { // This one is always added, regardless of authLocation 'header', 'query' or 'url'
                    rateLimit: {
                        sourceCriterion: {
                            requestHeaderName: authName
                        },
                        average: max,
                        period: `1${period}` //,
                        //burst: max
                    }
                }
            }
        }
    }

    var allProxyApikeys_regex = allProxyApikeys.join('|');
    for (var endpoint in oasDoc.paths) { // "ratelimiting-less" endpoints are taken from OAS as they're missing from SLA
        sanitized_endpoint = utils.sanitizeEndpoint(endpoint);
        if (!limitedPaths.includes(endpoint)) {
            for (var method in oasDoc.paths[endpoint]) {
                if (authLocation == "query") {
                    routersDefinition[`${sanitized_endpoint}_${method}`] = {
                        rule: `Path(\`${endpoint}\`) && Method(\`${method.toUpperCase()}\`) && Query(\`${authName}={${allProxyApikeys_regex}}\`)`,
                        service: "main-service"
                    }
                } else if (authLocation == "url") {
                    routersDefinition[`${sanitized_endpoint}_${method}`] = {
                        rule: `Path(\`${endpoint}/{${allProxyApikeys_regex}}\`) && Method(\`${method.toUpperCase()}\`)`,
                        service: "main-service",
                        middlewares: ["removeApikeyFromURL"]
                    }
                } else if (authLocation == "header") {
                    routersDefinition[`${sanitized_endpoint}_${method}`] = {
                        rule: `Path(\`${endpoint}\`) && Method(\`${method.toUpperCase()}\`) && HeadersRegexp(\`${authName}\`, \`${allProxyApikeys_regex}\`)`,
                        service: "main-service"
                    }
                }
            }
        }
    }

    if (authLocation == "url") {
        middlewaresDefinition["removeApikeyFromURL"] = {
            replacePathRegex: {
                regex: `/${allProxyApikeys_regex}`,
                replacement: "$1"
            }
        }
    }

    traefikTemplate.http.services["main-service"].loadBalancer.servers[0].url = apiServerURL
    traefikTemplate.http.routers = routersDefinition
    traefikTemplate.http.middlewares = middlewaresDefinition
    return jsyaml.dump(traefikTemplate, {
        lineWidth: -1
    })
}


/**
 * Receives an SLA agreement and produces (as string) an HAProxy config file according
 * to the rate limiting it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 * @param {string} apiServerURL - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
 * @param {string} authLocation - Where to look for the authentication parameter: 'header','query' or 'url'
 * @param {string} authName - Name of the authentication parameter, such as "token" or "apikey".
 * @param {string} proxyPort - Port on which the proxy is running.
 */
function generateHAproxyConfig(SLAs, oasDoc, apiServerURL, configTemplatePath, authLocation, authName, proxyPort) {

    if (configTemplatePath == null) {
        configTemplatePath = path.join(__dirname, '../templates/haproxy.cfg');
    }
    var haproxyTemplate = utils.getProxyConfigTemplate(configTemplatePath).toString();
    var frontendDefinition = "";
    var backendDefinition = "";
    var defaultBackendDefinition = "";
    var limitedPaths = [];
    var allProxyApikeys = [];
    var allProxyPlanNames = [];
    var getApikeyFromUrl = "";
    var removeApikeyFromURL = "";
    var apikeyChecks = "";
    var authCheckMethod = "str";
    var paramsCount;
    var endpoint_paramsRegexd;

    if (authLocation == "header") {
        authLocation = "hdr";
    } else if (authLocation == "query") {
        authLocation = "url_param";
    } else if (authLocation == "url") {
        authLocation = "hdr";
        authCheckMethod = "sub";

        getApikeyFromUrl = `
    # Create a header with the last part of the path (includes auth key)
    http-request del-header ${authName}
    http-request add-header ${authName} %[url]`;
    }
    apikeyChecks =
        `# Deny if missing key
    acl has_apikey ${authLocation}(${authName}) -m found
    http-request deny deny_status 401 if !has_apikey

    # Deny if bad key
`;

    for (var subSLA of SLAs) {
        var planName = subSLA["plan"]["name"];
        var slaContextID = subSLA["context"]["id"]
        allProxyPlanNames.push(`${slaContextID}_${planName}`);
        var subSLARates = subSLA["plan"]["rates"];
        var slaApikeys = subSLA["context"]["apikeys"]
        allProxyApikeys = allProxyApikeys.concat(slaApikeys);

        apikeyChecks += `    acl ${slaContextID}_${planName}_valid_apikey ${authLocation}(${authName}) -m ${authCheckMethod} ${slaApikeys.join(' ')}\n`;

        for (var endpoint in subSLARates) {
            limitedPaths.indexOf(endpoint) === -1 ? limitedPaths.push(endpoint) : {}; // only add if it is not already there (multiple SLAs agreements on a proxy have the same endpoints)
            var sanitized_endpoint = utils.sanitizeEndpoint(endpoint);

            for (var method in subSLARates[endpoint]) {

                var method_specs = subSLARates[endpoint][method];
                var max = method_specs["requests"][0]["max"];
                var period = utils.getLimitPeriod(method_specs["requests"][0]["period"], "traefik");
                method = method.toUpperCase();
                paramsCount = (endpoint.match(/{/g) || []).length;
                endpoint_paramsRegexd = endpoint.replace(/(\/{(.*?)\})+/g, `(?:\\/[^/]+){${paramsCount}}`); // If the endpoint has parameters these are regex'd

                frontendDefinition += `use_backend ${slaContextID}_${planName}_${sanitized_endpoint}_${method} if ${slaContextID}_${planName}_valid_apikey METH_${method} { path_reg \\${endpoint_paramsRegexd}\\/?$ } \n    `
                backendDefinition +=
                    `backend ${slaContextID}_${planName}_${sanitized_endpoint}_${method}
    stick-table type string len 100 size 100k expire 1${period} store http_req_rate(1${period})
    http-request deny deny_status 429 if { ${authLocation}(${authName}),table_http_req_rate() ge ${max} }
    http-request track-sc0 ${authLocation}(${authName})
    server ${sanitized_endpoint} ${apiServerURL.replace("http://", "")}\n` // the protocol is removed as it's not allowed here
            }
        }
    }

    if (limitedPaths.length != Object.keys(oasDoc.paths).length) { // "ratelimiting-less" endpoints management
        for (var endpoint in oasDoc.paths) {
            if (!limitedPaths.includes(endpoint)) {
                for (var method in oasDoc.paths[endpoint]) {
                    method = method.toUpperCase();
                    paramsCount = (endpoint.match(/{/g) || []).length;
                    endpoint_paramsRegexd = endpoint.replace(/(\/{(.*?)\})+/g, `(?:\\/[^/]+){${paramsCount}}`); // If the endpoint has parameters these are regex'd
                    frontendDefinition += `use_backend no_ratelimit_endpoints if METH_${method} { path_reg \\${endpoint_paramsRegexd}\\/?$ }\n    `;
                }
            }
        }
        defaultBackendDefinition =
            `backend no_ratelimit_endpoints
    server no_ratelimit_endpoints ${apiServerURL.replace("http://", "")}`;
    }

    apikeyChecks += `    http-request deny deny_status 403 if`;
    allProxyPlanNames.forEach(element => {
        apikeyChecks += ` !${element}_valid_apikey`;
    });

    if (authLocation == "hdr" && authCheckMethod == "sub") { // doing two checks because authLocation is modified above 
        removeApikeyFromURL = `
    # Remove apikey from url
    http-request replace-path (.*)/(${allProxyApikeys.join('|')}) \\1`;
    }

    return haproxyTemplate
        .replace('%%PROXY_PORT_PH%%', proxyPort)
        .replace('%%GET_APIKEY_FROM_URL_PH%%', getApikeyFromUrl)
        .replace('%%APIKEY_CHECKS_PH%%', apikeyChecks)
        .replace('%%REMOVE_API_FROM_URL_PH%%', removeApikeyFromURL)
        .replace('%%FRONTEND_PH%%', frontendDefinition)
        .replace('%%DEFAULT_BACKEND_PH%%', defaultBackendDefinition)
        .replace('%%BACKENDS_PH%%', backendDefinition);
}


/**
 * Receives an SLA agreement and produces (as string) an NGINX config file according
 * to the rate limiting it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 * @param {string} apiServerURL - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
 * @param {string} authLocation - Where to look for the authentication parameter: 'header','query' or 'url'
 * @param {string} authName - Name of the authentication parameter, such as "token" or "apikey".
 * @param {string} proxyPort - Port on which the proxy is running.
 */
function generateNginxConfig(SLAs, oasDoc, apiServerURL, configTemplatePath, authLocation, authName, proxyPort) {

    if (configTemplatePath == null) {
        configTemplatePath = path.join(__dirname, '../templates/nginx.conf');
    }
    var nginxTemplate = utils.getProxyConfigTemplate(configTemplatePath).toString();
    var limitsDefinition = "";
    var locationDefinitions = "";
    var uriRewrites = "";
    var limitedPaths = [];
    var allProxyApikeys = [];
    var uriOriginalSave = "set $uri_original $uri;"
    var getApikeyFromUrl = "";
    var location;

    if (authLocation == "header") {
        authLocation = "http";
    } else if (authLocation == "query") {
        authLocation = "arg";
    } else if (authLocation == "url") {
        authLocation = "from_url";
        getApikeyFromUrl = `
        if ($request_uri ~* "([^/]*$)" ) { # Gets the apikey from the url
          set $from_url_apikey  $1;
        }`;
        uriOriginalSave = `
        if ($request_uri ~* "((.*)/)" ) { # Gets the url w/o apikey
          set $uri_original  $1;
        }`;
    }
    var mapApikeysDefinition = `map $${authLocation}_${authName} $api_client_name {\n     default "";\n`;

    for (var subSLA of SLAs) {
        var planName = subSLA["plan"]["name"];
        var subSLARates = subSLA["plan"]["rates"];
        var slaApikeys = subSLA["context"]["apikeys"]
        var slaContextID = subSLA["context"]["id"]
        allProxyApikeys = allProxyApikeys.concat(slaApikeys);
        mapApikeysDefinition += `     "~(${slaApikeys.join('|')})" "${slaContextID}_${planName}";\n`;

        for (var endpoint in subSLARates) {
            limitedPaths.indexOf(endpoint) === -1 ? limitedPaths.push(endpoint) : {};

            for (var method in subSLARates[endpoint]) {
                var method_specs = subSLARates[endpoint][method];
                var max = method_specs["requests"][0]["max"];
                var period = utils.getLimitPeriod(method_specs["requests"][0]["period"], "nginx");

                var zone_name = `${slaContextID}_${planName}_${utils.sanitizeEndpoint(endpoint)}_${method.toUpperCase()}`;
                var zone_size = "10m" // 1m = 1 megabyte = 16k IPs

                var endpointBurst = parseInt(max, 10) - 1
                /////////////// LIMITS
                var limit = `limit_req_zone $${authLocation}_${authName} ` +
                    `zone=${zone_name}:${zone_size} rate=${max}r/${period};\n    `
                limitsDefinition += limit;

                /////////////// LOCATIONS
                if(endpointBurst > 0){
                location = `
                    location /${zone_name} {
                        rewrite /${zone_name} $uri_original break;
                        proxy_pass ${apiServerURL};
                        limit_req zone=${zone_name} burst=${endpointBurst} nodelay;
                    }`
                } else if(endpointBurst === 0){
                location = `
                    location /${zone_name} {
                        rewrite /${zone_name} $uri_original break;
                        proxy_pass ${apiServerURL};
                        limit_req zone=${zone_name} nodelay;
                    }`
                }


                locationDefinitions += location;
            }
        }
    }

    for (var endpoint in oasDoc.paths) {
        var planBased = `\${api_client_name}_`;
        var check = "=";
        if (endpoint.includes('{')) {
            check = "~";
        }
        if (!limitedPaths.includes(endpoint)) { // "ratelimiting-less" endpoints 
            var methods = Object.keys(oasDoc.paths[endpoint]).join('|').toUpperCase();
            planBased = "";
            /////////////// LOCATIONS
            location = ` 
        location ~ /${utils.sanitizeEndpoint(endpoint)}_(${methods}) {
            rewrite /${utils.sanitizeEndpoint(endpoint)}_(${methods}) $uri_original break;
            proxy_pass ${apiServerURL};
        }`
            locationDefinitions += location;
        }

        /////////////// URI BASED ROUTING
        var endpoint_paramsRegexd = endpoint.replace(/\{(.*?)\}/g, '(.+)'); // If the endpoint has parameters, these are modified so Nginx understands them
        var apikeysInUrl = "";
        if (authLocation == "from_url") {
            if (check == "~") {
                apikeysInUrl = `/(${allProxyApikeys.join('|')})`;
            } else {
                apikeysInUrl = `/$${authLocation}_${authName}`;
            }
        }
        uriRewrites += `
        if ($uri ${check} ${endpoint_paramsRegexd}${apikeysInUrl}) {
          rewrite ${endpoint_paramsRegexd} "/${planBased}${utils.sanitizeEndpoint(endpoint)}_\${request_method}" break; 
        }`;
    }

    return nginxTemplate
        .replace('%%LIMIT_REQ_ZONE_PH%%', limitsDefinition)
        .replace('%%MAP_APIKEYS_PH%%', mapApikeysDefinition + '    }')
        .replace('%%PROXY_PORT_PH%%', proxyPort)
        .replace('%%GET_APIKEY_FROM_URL_PH%%', getApikeyFromUrl)
        .replace('%%AUTH_LOCATION_PH%%', `${authLocation}_${authName}`)
        .replace('%%URI_ORIGINAL_SAVE_PH%%', uriOriginalSave)
        .replace('%%URI_REWRITES_PH%%', uriRewrites)
        .replace('%%LOCATIONS_PH%%', locationDefinitions);
}


/**
 * Given a URL, makes a GET request to get an array of SLAs.
 * @param {string} slasURL - A URL.
 * @param {string} proxyType - Proxy type, one of: envoy, haproxy, nginx, traefik.
 * @param {object} oasDoc - Open API definition.
 * @param {string} apiServerURL - API server url.
 * @param {string} customTemplate - Path to proxy config template.
 * @param {string} outFile - Path where to save the produced proxy configuration.
 */
function getSLAsFromURL(slasURL, proxyType, oasDoc, apiServerURL, customTemplate, outFile) {
    axios
        .get(slasURL)
        .then(res => {
            // Validate SLAs
            var SLAsFiltered = utils.validateSLAs(res.data);

            // Generate and write to file proxy config according to SLA
            generateProxyConfig(proxyType,
                SLAsFiltered,
                oasDoc,
                apiServerURL,
                customTemplate,
                outFile);
        }).catch(error => {
            configs.logger.error(error + ", quitting");
            process.exit(1);
        });
}


/**
 * Stops the run if not all endpoints from the SLAs are present in the OAS. 
 * @param {object} customTemplate - 'paths' section of the OAS document.
 * @param {object} SLAsFiltered - List of SLAs. 
 */
function checkEndpointIntersection(oasDocPaths, SLAsFiltered){
    for (var subSLA of SLAsFiltered) {
        for (var endpoint in subSLA["plan"]["rates"]) {
            if (Object.keys(oasDocPaths).includes(endpoint) == false){
                configs.logger.error("There are paths in the SLAs that are not present in the OAS. Quitting");
                process.exit(1);
            }
        }
    }
}


/**
 * Configuration file generation handle.
 * @param {string} oasPath - Path to the OAS description.
 * @param {string} proxyType - Proxy type.
 * @param {string} slaPath - Path to the SLA description. 
 * @param {string} outFile - Path where to save the produced proxy configuration.
 * @param {string} customTemplate - Path to custom proxy config template. 
 * @param {string} authLocation - Where to look for the authentication parameter: 'header','query' or 'url'
 * @param {string} authName - Name of the authentication parameter, such as "token" or "apikey".
 * @param {string} proxyPort - Port on which the proxy is running.
 */
function generateConfigHandle(oasPath, proxyType, slaPath, outFile, customTemplate, authLocation, authName, proxyPort) {

    // Load and validate OAS
    var oasDoc = utils.loadAndValidateOAS(oasPath);

    // Get server URL
    try {
        var apiServerURL = oasDoc.servers[0].url;
    } catch {
        configs.logger.error("OAS' servers property missing");
        process.exit(1);
    }

    // Load all SLA path(s)
    var SLAs = [];

    if (utils.isAValidUrl(slaPath)) { // URL
        configs.logger.debug(`Getting SLAs from ${slaPath}...`);
        getSLAsFromURL(slaPath, // This function getSLAsFromURL calls generateProxyConfig
            proxyType,
            oasDoc,
            apiServerURL,
            customTemplate,
            outFile);
    } else {
        try {
            if (fs.lstatSync(slaPath).isDirectory()) { // FOLDER (if there's a folder inside the folder this will fail)
                fs.readdirSync(slaPath).forEach(file => {
                    var partialSlaPath = path.join(slaPath, file); // add base path to SLA paths
                    configs.logger.debug(`File in directory: ${partialSlaPath}`);
                    SLAs.push(jsyaml.load(fs.readFileSync(path.join('', partialSlaPath), 'utf8')));
                });
            } else { // FILE
                configs.logger.debug(`File: ${slaPath}`);
                SLAs.push(jsyaml.load(fs.readFileSync(path.join('', slaPath), 'utf8')));
            }
        } catch (err) {
            configs.logger.error(`Error with SLA(s) ${slaPath}: ${err}. Quitting`);
            process.exit(1);
        }

        // Validate SLAs
        var SLAsFiltered = utils.validateSLAs(SLAs);

        // Check all endpoints from the SLAs are present in the OAS
        checkEndpointIntersection(oasDoc.paths, SLAsFiltered);

        // Generate and write to file proxy config according to SLA
        generateProxyConfig(proxyType,
            SLAsFiltered,
            oasDoc,
            apiServerURL,
            customTemplate,
            outFile,
            authLocation,
            authName,
            proxyPort)
    }
}


/**
 * Calls the actual proxy config file generation functions.
 * @param {string} proxyType - Proxy type.
 * @param {object} SLAsFiltered - Valid SLAs.
 * @param {object} oasDoc - Open API definition.
 * @param {string} apiServerURL - API server url.
 * @param {string} customTemplate - Path to custom proxy config template.
 * @param {string} outFile - Path where to save the produced proxy configuration.
 * @param {string} authLocation - Where to look for the authentication parameter: 'header','query' or 'url'
 * @param {string} authName - Name of the authentication parameter, such as "token" or "apikey".
 * @param {string} proxyPort - Port on which the proxy is running.
 */
function generateProxyConfig(proxyType, SLAsFiltered, oasDoc, apiServerURL, customTemplate, outFile, authLocation, authName, proxyPort) {
    var proxyConf;
    switch (proxyType) {
        case 'nginx':
            proxyConf = generateNginxConfig(SLAsFiltered,
                oasDoc,
                apiServerURL,
                customTemplate,
                authLocation,
                authName,
                proxyPort);
            break;
        case 'haproxy':
            proxyConf = generateHAproxyConfig(SLAsFiltered,
                oasDoc,
                apiServerURL,
                customTemplate,
                authLocation,
                authName,
                proxyPort);
            break;
        case 'traefik':
            proxyConf = generateTraefikConfig(SLAsFiltered,
                oasDoc,
                apiServerURL,
                customTemplate,
                authLocation,
                authName);
            break;
        case 'envoy':
            proxyConf = generateEnvoyConfig(SLAsFiltered,
                oasDoc,
                apiServerURL,
                customTemplate,
                authLocation,
                authName,
                proxyPort);
            break;
    }
    fs.writeFileSync(outFile, proxyConf);
}


module.exports = {
    generateConfigHandle: generateConfigHandle
};