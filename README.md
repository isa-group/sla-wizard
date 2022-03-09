# SLA4OAI-tools

## Usage

```bash
Usage: sla4oai-tools <OAS v3 file in JSON or YAML> <options>

Options:
  -t, --type <proxyType>             Proxy for which the configuration should be generated.
  -o, --outFile <configFile>         Config output file.
  --customTemplate <customTemplate>  Custom proxy configuration template.
  -h, --help                         display help for command.
```

## Workflow

Dependencies must be installed prior to using the tool:

```bash
npm install
```

The following steps indicate how to create proxy configuration files and validate they work as expected. SLA4OAI-tools uses both the API's OAS and SLA definitions for that.

### 1. Create proxy config

#### NGINX

```bash
node src/index.js test/specs/simple_api_oas.yaml --type nginx --outFile test/nginx-auto.conf
```

#### HAProxy

```bash
# TODO
```


### 2. Spin up two containers: proxy and API

For this, docker-compose is used. The variable `CFG_PATH` should point to the configuration file created in the previous step. The path should be relative to where the docker-compose.yaml file is.

```bash
sudo docker build -t simple_api . # builds the image used for testing
sudo CFG_PATH=./nginx-auto.conf docker-compose --file test/docker-compose.yaml up
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

# TODO

artillery quick --count 1 --num 10 http://localhost/open-endpoint

artillery quick --count 1 --num 10 http://localhost/once-per-second-endpoint

artillery quick --count 1 --num 10 http://localhost/twice-per-minute-endpoint

```
