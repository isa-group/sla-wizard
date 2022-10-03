# SLA Wizard

## Usage

Once the tool is published in npm, it will be possible to install it using `npm install sla-wizard` but until then, to get the tool clone the repository and install dependencies:

```bash
git clone https://github.com/isa-group/sla-wizard
cd sla-wizard
npm install
```

Displayed below is the output of the `-h` option of sla-wizard CLI:

```bash
$ node src/index.js -h
Usage: sla-wizard <arguments> <options>

Options:
  -h, --help                display help for command

Commands:
  config [options] <proxy>
  runTest [options]         Run test with APIPecker.
  help [command]            display help for command
```

SLA Wizard includes currently two commands:

| Command  |  Explanation |
|---|---|
| `config`  |  Takes an SLA document and generates a proxy configuration file which includes rate limiting as specified on the provided SLA. |
| `runTest` |  Performs validation testing of the rate limiting defined on a proxy by an SLA Wizard-generated configuration file. |

To control log levels define the environment variable `LOGGER_LEVEL` prior to the run. The possible values are `error`, `warn`, `custom`, `info` and `debug`.

## To consider

### SLA types

SLA Wizard only works with SLAs of type `agreement`. It validates the provided SLAs with the [SLA4OAI-Specification JSON schema](https://github.com/isa-group/SLA4OAI-Specification/blob/main/schemas/1.0.0-Draft.schema.json).
If any of the provided SLAs is not valid (does not conform to schema or is not of type agreement), the execution will stop. Additionally, duplicated SLAs will be ignored.

### URL reference in OAS

While it is possible to specify multiple servers in the OAS' `servers` section, sla-wizard will use only the first one.
For instance, in the following example only `http://server1:8080` is considered:

```yaml
openapi: 3.0.0
servers:
  - url: 'http://server1:8080'
  - url: 'http://server2:8080'
  - url: 'http://server3:8080'
```

### SLA reference

Both SLA Wizard functionalities provided by the commands `config` and `runTest` require an SLA document. While it is possible to reference the SLA directly in the OAS document (`info.x-sla.$ref`), the tool will not consider it. Instead, please use the commands' `--sla` option to indicate where the SLA document(s) can be found. This option can take a path to a single file, a folder containing multiple files or even a URL (note GET to the URL must receive an array, even if there's only one SLA).

### API Authentication 

APIs support different authentication methods. When authenticating with an API key, generally, it is possible to provide it in different places of the request: 

1. As a header
2. As a query parameter
3. As part of the URL

All the proxies supported by SLA Wizard allow using API keys on these three locations. When creating a proxy configuration file, the option `--authLocation` of SLA Wizard's `config` command should be used to set this, it can take the values `header`, `query` and `url`. In any case, the usage of the option is not compulsory, its default value is `header`. 

## Creating proxy configurations

SLA Wizard can create configuration files from scratch for four different proxy technologies: Envoy, HAProxy, Nginx and Traefik. Also, it can modify an already existing configuration file, to add the SLA logic. 

### Envoy

To create a configuration file for an Envoy proxy, use the argument `envoy` of the `config` command, for example:

```bash
node src/index.js config envoy --oas tests/specs/simple_api_oas.yaml --outFile tests/proxy-configuration
```

**Note**: currently, [global rate limit](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_features/global_rate_limiting) is not supported, only [local rate limit](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/local_rate_limit_filter). 

#### Custom Template

Refer to `templates/envoy.yaml`.

### HAProxy

To create a configuration file for an HAProxy proxy, use the argument `haproxy` of the `config` command, for example:

```bash
node src/index.js config haproxy --oas tests/specs/simple_api_oas.yaml --outFile tests/proxy-configuration
```

#### Custom Template

Refer to `templates/haproxy.cfg`.

### NGINX

To create a configuration file for a NGINX proxy, use the argument `nginx` of the `config` command, for example:

```bash
node src/index.js config nginx --oas tests/specs/simple_api_oas.yaml --outFile tests/proxy-configuration
```

#### Custom Template

Refer to `templates/nginx.conf`.

### Traefik

Unlike in the other three proxies supported by sla-wizard, besides the main configuration file a dynamic configuration file is needed. This file is the one that sla-wizard creates. To do that, use the argument `traefik` of the `config` command, for example:

```bash
node src/index.js config traefik --oas tests/specs/simple_api_oas.yaml --outFile tests/proxy-configuration
```

#### Custom Template

Refer to `templates/traefik.yaml`.

## Testing

Dependencies must be installed prior to using the tool:

```bash
npm install
```

The following steps indicate how to create proxy configuration files and validate they work as expected. sla-wizard uses both the API's OAS and SLA definitions for that.

### Requirements:

The following are optional properties in OAS v3. However, they are required when using sla-wizard:

- `servers`

### 1. Create proxy config

To create the config file of a proxy use the following command:

```bash
node src/index.js config <proxy> --oas <pathToOAS> --outFile <destinationFile>
```

For examples refer to the section [Supported proxies](#supported-proxies).


### 2. Spin up two containers: proxy and API

For this, docker-compose is used. The variable `CFG_PATH` should point to the configuration file created in the previous step. The path should be relative to where the docker-compose YAML file is.

#### NGINX

```bash
sudo CFG_PATH=../proxy-configuration docker-compose --file tests/nginx/docker-compose-nginx.yaml up
```

#### HAProxy

```bash
sudo CFG_PATH=../proxy-configuration docker-compose --file tests/haproxy/docker-compose-haproxy.yaml up
```

#### Traefik

In the case of Traefik, the file that sla-wizard writes is the dynamic configuration file, The main configuration file should look like this:

```yaml
entryPoints:
  http:
    address: ':80'
  https:
    address: ':443'
providers:
  file:
    filename: /etc/traefik/traefik-dynamic-cfg.yaml
```

Where `provider.file.filename` contains the path to the dynamic configuration file created by sla-wizard. When spinning up the containers as in the command below, the variable `D_CFG_PATH` indicates the path to the dynamic configuration file:

```bash
sudo D_CFG_PATH=../proxy-configuration CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml up
```

#### Envoy

```bash
sudo CFG_PATH=../proxy-configuration docker-compose --file tests/envoy/docker-compose-envoy.yaml up
```


### 3. Validate that the proxy is properly configured

#### APIPecker

Source: https://www.npmjs.com/package/apipecker

```bash

# apipecker <concurrentUsers> <iterations> <delay in ms> <url> [-v]

apipecker 5 10 500 http://localhost/open-endpoint -v # should succeed

apipecker 1 5 1100 http://localhost/first-endpoint -v # should succeed

apipecker 1 10 700 http://localhost/first-endpoint -v # half should fail

```

## License

Copyright 2022, [ISA Group](http://www.isa.us.es), [University of Sevilla](http://www.us.es)

[![ISA Group](http://www.isa.us.es/2.0/assets/img/theme/logo2.png)](http://www.isa.us.es)

Licensed under the **Apache License, Version 2.0** (the "[License](./LICENSE)"); you may not use this file except in compliance with the License. You may obtain a copy of the License at apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.