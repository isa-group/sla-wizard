# NGINX

The approach followed by Nginx for rate limiting of requests is the creation of zones where requests are grouped by a specific parameter or key, like the source address a header or a query parameter. In the case of SLA Wizard, the requests are grouped by the apikey which can be received as a header, query or URL parameter.

Once the apikey is validated, the request is routed to the right [location](http://nginx.org/en/docs/http/ngx_http_core_module.html#location), where the rate limiting is applied based on the zones previously mentioned and eventually forwarded to the upstream service, this is, the API server.

| API key location | Implementation                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Header           | Grouping of requests is done using `$http_` for `limit_req_zone`.                                                                      |
| Query            | Grouping of requests is done using `$arg_` for `limit_req_zone`.                                                                       |
| URL              | A variable is created using `http-request add-header apikey %[url]` and then, grouping of requests is done using it for `http_apikey`. |

To create a configuration file for a NGINX proxy, use the argument `nginx` of the `config` command, for example:

```bash
node src/index.js config nginx --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-nginx.conf
```

## Custom Template

Refer to [`templates/nginx.conf`](../templates/nginx.conf). The placeholders are the strings that start and end with `%%`, SLA Wizard will replace these with actual configuration content when its run.

| Placeholder                  | Required                          | Explanation (what it is replaced with)                                                                                                      |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `%%LIMIT_REQ_ZONE_PH%%`      | Yes                               | Definition of the zones (one for each plan-path-method combination) with the rate limiting using `limit_req_zone`.                          |
| `%%MAP_APIKEYS_PH%%`         | Yes                               | Map that will be used to translate an apikey to a plan name, for example: H8Fv6UmGcj9y3Bb9TVF9-p -> `pro`.                                  |
| `%%PROXY_PORT_PH%%`          | Yes                               | The port on which the proxy will be running, which defaults to 80 but can be set with the option `--proxyPort`                              |
| `%%GET_APIKEY_FROM_URL_PH%%` | Yes, if `--authLocation` is `url` | Creation of a header with the apikey from the URL using `http-request add-header apikey %[url]`.                                            |
| `%%AUTH_LOCATION_PH%%`       | Yes                               | It is replaced with `from_url_apikey` if `--authLocation` is `header` or `url` and `arg_apikey` if it is `query`.                           |
| `%%URI_ORIGINAL_SAVE_PH%%`   | Yes                               | Saving the original URL in a variable for later routing.                                                                                    |
| `%%URI_REWRITES_PH%%`        | Yes                               | Rewrite of the URL to route to the right location.                                                                                          |
| `%%LOCATIONS_PH%%`           | Yes                               | Where rate limiting is applied, using `limit_req` and pointing to the righ zone. Also, the URL is rewriten to the one originally requested. |
