# Workflow

## 1. Create proxy config

The NGINX configuration file is generated using both the OAS and its SLA definition YAML files:

```bash
npm install
node src/index.js specs/simple_api_oas.yaml --type nginx --outFile test/nginx-auto.conf
```

## 2. Spin up two containers: proxy and API

For this, docker-compose is used. The variable `CFG_PATH` should point to the configuration file created in the previous step. The path should be relative from where the docker-compose.yaml file is.

```bash
sudo docker build -t simple_api . # builds the image used for testing
sudo CFG_PATH=./nginx-auto.conf docker-compose --file test/docker-compose.yaml up
```

## 3. Validate that the proxy is properly configured

### APIPecker

Source: https://www.npmjs.com/package/apipecker


```bash

# apipecker <concurrentUsers> <iterations> <delay in ms> <url> [-v]

apipecker 5 10 500 http://localhost/open-endpoint # works

apipecker 1 5 1000 http://localhost/once-per-second-endpoint # works

apipecker 1 10 500 http://localhost/once-per-second-endpoint # half fails

apipecker 2 3 60000 http://localhost/twice-per-minute-endpoint # works

apipecker 4 3 60000 http://localhost/twice-per-minute-endpoint # half fails

```

### Artillery

Source: https://www.artillery.io/

```bash
# TODO
```
