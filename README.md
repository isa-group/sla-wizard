# SLA4OAI-tools

## Usage

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

### SLA types

TODO: document if any of the provided SLAs is not valid (does not conform to schema or is not of type agreement), the execution will stop. Additionally, duplicated SLAs will be ignored.
TODO document that the URL must return an array even if it's just one.

SLA4OAI-tools only works with SLAs of type `agreement`.
If the provided OAS references SLA(s) of type `plan` then those would not be contemplated for the proxy configuration.


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

The following are supported:

```yaml
info:
  x-sla:
    $ref:
     - ./sla.yaml
```

```yaml
info:
  x-sla:
    $ref:
     - ./sla1.yaml
     - ./sla2.yaml
```

```yaml
info:
  x-sla:
    $ref:
     - ./slas1Dir/
```

```yaml
info:
  x-sla:
    $ref:
    - ./slasDir1/
    - ./slasDir2/
```

```yaml
info:
  x-sla:
    $ref:
    - http://server.example/slas
```
```yaml
info:
  x-sla:
    $ref:
    - http://server.example/slas1
    - http://server.example/slas2
```

Also combinations:

```yaml
info:
  x-sla:
    $ref:
    - ./sla1.yaml
    - ./slasDir1/
    - ./slasDir2/
    - http://server.example/slas1
```


## Workflow

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
sudo D_CFG_PATH=../proxy-configuration CFG_PATH=./traefik.toml docker-compose --file test/traefik/docker-compose-traefik.yaml up
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
