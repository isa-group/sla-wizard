# SLA4OAI-tools

## Usage

Once the tool is published in npm, it will be possible to install it using `npm install ...` but until then, to get the tool clone the repository:

```bash
git clone https://github.com/isa-group/SLA4OAI-tools
```

Dependencies must be installed prior to using the tool:

```bash
npm install
```

Displayed below is the output of the `-h` option of SLA4OAI-tools' CLI:

```bash
Usage: sla4oai-tools <arguments> <options>

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

SLA4OAI-tools only works with SLAs of type `agreement`. The provided SLA(s) will be validated according to a schema.
If any of the provided SLAs is not valid (does not conform to schema or is not of type agreement), the execution will stop. Additionally, duplicated SLAs will be ignored.

### URL reference in OAS

While it is possible to specify multiple servers in the OAS' `servers` section, SLA4OAI-tools will use only the first one.
For example, in the following example only `http://server1:8080` is considered:

```yaml
openapi: 3.0.0
servers:
  - url: 'http://server1:8080'
  - url: 'http://server2:8080'
  - url: 'http://server3:8080'
```

### SLA reference in OAS

The following are supported. Single file:

```yaml
    $ref:
     - ./sla.yaml
```

Multiple files:

```yaml
    $ref:
     - ./sla1.yaml
     - ./sla2.yaml
```

Single directory containing SLA(s):

```yaml
    $ref:
     - ./slas1Dir/
```

Multiple directories containing SLA(s):

```yaml
    $ref:
    - ./slasDir1/
    - ./slasDir2/
```

Single URL (GET to the URL must receive an array):

```yaml
    $ref:
    - http://server.example/slas
```

Multiple URLs (GET to these URLs must receive arrays):

```yaml
    $ref:
    - http://server.example/slas1
    - http://server.example/slas2
```

Also, combinations:

```yaml
    $ref:
    - ./sla1.yaml
    - ./slasDir1/
    - ./slasDir2/
    - http://server.example/slas1
    - http://server.example/slas2
```

## Supported proxies

### Envoy


### HAProxy


### NGINX


### Traefik

TODO: document that in this case two files are needed: the main configuration (which sla4oai-tools should be able to create, following a CLI parameter) and the dynamic config file. The main config should look like this:

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

The following steps indicate how to create proxy configuration files and validate they work as expected. SLA4OAI-tools uses both the API's OAS and SLA definitions for that.

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

In the case of Traefik, the file that SLA4OAI-tools writes is the dynamic configuration file, in the command below provided with the variable `D_CFG_PATH`.

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

apipecker 5 10 500 http://localhost/open-endpoint # should succeed

apipecker 1 5 1000 http://localhost/once-per-second-endpoint # should succeed

apipecker 1 10 500 http://localhost/once-per-second-endpoint # half should fail

apipecker 2 3 60000 http://localhost/twice-per-minute-endpoint # should succeed

apipecker 4 3 60000 http://localhost/twice-per-minute-endpoint # half should fail

```

#### Artillery

Source: https://www.artillery.io/

* `count`: number of virtual users
* `num`: number of requests that should be made per user

```bash

artillery quick --count 1 --num 10 http://localhost/open-endpoint

artillery quick --count 1 --num 10 http://localhost/once-per-second-endpoint

artillery quick --count 1 --num 10 http://localhost/twice-per-minute-endpoint

```
