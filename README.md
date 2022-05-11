# SLA Wizard

## Usage

Once the tool is published in npm, it will be possible to install it using `npm install ...` but until then, to get the tool clone the repository:

```bash
git clone https://github.com/isa-group/sla-wizard
```

Dependencies must be installed prior to using the tool:

```bash
npm install
```

Displayed below is the output of the `-h` option of sla-wizard' CLI:

```bash
Usage: sla-wizard <arguments> <options>

Arguments:
  file                               Path to a OAS v3 file
  proxy                              Proxy for which the configuration should
                                     be generated. (choices: "nginx",
                                     "haproxy", "traefik", "envoy")

Options:
  -o, --outFile <configFile>         Config output file.
  --customTemplate <customTemplate>  Custom proxy configuration template.
  -h, --help                         display help for command
```

To control log levels define the environment variable `LOGGER_LEVEL` prior to the run. The possible values are error, warn, custom, info and debug.

## Prerequisites

### SLA types

SLA Wizard only works with SLAs of type `agreement`. The provided SLA(s) will be validated according to a schema.
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

### SLA reference in OAS

The following are supported:

#### Single file

```yaml
    $ref:
     - ./sla.yaml
```

#### Multiple files

```yaml
    $ref:
     - ./sla1.yaml
     - ./sla2.yaml
```

#### Single directory containing SLA(s)

```yaml
    $ref:
     - ./slas1Dir/
```

#### Multiple directories containing SLA(s)

```yaml
    $ref:
    - ./slasDir1/
    - ./slasDir2/
```

#### Combinations

```yaml
    $ref:
    - ./sla1.yaml
    - ./slasDir1/
    - ./slasDir2/
```

#### Single URL

GET to the URL must receive an array. Unlike in the previous cases, here only one URL is allowed.

```yaml
    $ref:
    - http://server.example/slas
```

## Supported proxies

### Envoy


### HAProxy


### NGINX


### Traefik

In this case two files are needed: the main configuration (which sla-wizard should be able to create, following a CLI parameter) and the dynamic config file. The main config should look like this:

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


## Test

Dependencies must be installed prior to using the tool:

```bash
npm install
```

The following steps indicate how to create proxy configuration files and validate they work as expected. sla-wizard uses both the API's OAS and SLA definitions for that.

### Requirements:

The following are optional properties in OAS v3. However, they are required for SLA4OAI:

- `servers`
- `info.x-sla`

### 1. Create proxy config

#### NGINX

```bash
node src/index.js test/specs/simple_api_oas.yaml nginx --outFile test/proxy-configuration
```

#### HAProxy

```bash
node src/index.js test/specs/simple_api_oas.yaml haproxy --outFile test/proxy-configuration
```

#### Traefik

```bash
node src/index.js test/specs/simple_api_oas.yaml traefik --outFile test/proxy-configuration
```

#### Envoy

```bash
node src/index.js test/specs/simple_api_oas.yaml envoy --outFile test/proxy-configuration
```


### 2. Spin up two containers: proxy and API

For this, docker-compose is used. The variable `CFG_PATH` should point to the configuration file created in the previous step. The path should be relative to where the docker-compose YAML file is.

#### NGINX

```bash
sudo CFG_PATH=../proxy-configuration docker-compose --file test/nginx/docker-compose-nginx.yaml up
```

#### HAProxy

```bash
sudo CFG_PATH=../proxy-configuration docker-compose --file test/haproxy/docker-compose-haproxy.yaml up
```

#### Traefik

In the case of Traefik, the file that sla-wizard writes is the dynamic configuration file, in the command below provided with the variable `D_CFG_PATH`.

```bash
sudo D_CFG_PATH=../proxy-configuration CFG_PATH=./traefik.yaml docker-compose --file test/traefik/docker-compose-traefik.yaml up
```

#### Envoy

```bash
sudo CFG_PATH=../proxy-configuration docker-compose --file test/envoy/docker-compose-envoy.yaml up
```


### 3. Validate that the proxy is properly configured

#### APIPecker

Source: https://www.npmjs.com/package/apipecker

```bash

# apipecker <concurrentUsers> <iterations> <delay in ms> <url> [-v]

apipecker 5 10 500 http://localhost/open-endpoint -v # should succeed

apipecker 1 5 1100 http://localhost/once-per-second-endpoint -v # should succeed

apipecker 1 10 700 http://localhost/once-per-second-endpoint -v # half should fail

```
