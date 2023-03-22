######### Envoy

## Header

PROXY_CONF_FILE=proxy-configuration-envoy-header.yaml
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/envoy/docker-compose-envoy.yaml down
node src/index.js config envoy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/$PROXY_CONF_FILE
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/envoy/docker-compose-envoy.yaml up #--build

## Query

PROXY_CONF_FILE=proxy-configuration-envoy-query.yaml
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/envoy/docker-compose-envoy.yaml down
node src/index.js config envoy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/$PROXY_CONF_FILE --authLocation query
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/envoy/docker-compose-envoy.yaml up #--build

## Url

PROXY_CONF_FILE=proxy-configuration-envoy-url.yaml
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/envoy/docker-compose-envoy.yaml down
node src/index.js config envoy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/$PROXY_CONF_FILE --authLocation url
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/envoy/docker-compose-envoy.yaml up #--build


######### HAProxy

## Header

PROXY_CONF_FILE=proxy-configuration-haproxy-header.cfg
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/haproxy/docker-compose-haproxy.yaml down
node src/index.js config haproxy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/$PROXY_CONF_FILE
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/haproxy/docker-compose-haproxy.yaml up #--build

## Query

PROXY_CONF_FILE=proxy-configuration-haproxy-query.cfg
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/haproxy/docker-compose-haproxy.yaml down
node src/index.js config haproxy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/$PROXY_CONF_FILE --authLocation query
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/haproxy/docker-compose-haproxy.yaml up #--build

## Url

PROXY_CONF_FILE=proxy-configuration-haproxy-url.cfg
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/haproxy/docker-compose-haproxy.yaml down
node src/index.js config haproxy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/$PROXY_CONF_FILE --authLocation url
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/haproxy/docker-compose-haproxy.yaml up #--build


######### NGINX

## Header

PROXY_CONF_FILE=proxy-configuration-nginx-header.conf
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/nginx/docker-compose-nginx.yaml down
node src/index.js config nginx --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/$PROXY_CONF_FILE
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/nginx/docker-compose-nginx.yaml up #--build

## Query

PROXY_CONF_FILE=proxy-configuration-nginx-query.conf
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/nginx/docker-compose-nginx.yaml down
node src/index.js config nginx --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/$PROXY_CONF_FILE --authLocation query
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/nginx/docker-compose-nginx.yaml up #--build

## Url

PROXY_CONF_FILE=proxy-configuration-nginx-url.conf
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/nginx/docker-compose-nginx.yaml down
node src/index.js config nginx --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/$PROXY_CONF_FILE --authLocation url
sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/nginx/docker-compose-nginx.yaml up #--build


######### TRAEFIK

## Header

PROXY_CONF_FILE=proxy-configuration-traefik-header.yaml
sudo D_CFG_PATH=../$PROXY_CONF_FILE CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml down
node src/index.js config traefik --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/$PROXY_CONF_FILE
sudo D_CFG_PATH=../$PROXY_CONF_FILE CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml up #--build

## Query

PROXY_CONF_FILE=proxy-configuration-traefik-query.yaml
sudo D_CFG_PATH=../$PROXY_CONF_FILE CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml down
node src/index.js config traefik --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/$PROXY_CONF_FILE --authLocation query
sudo D_CFG_PATH=../$PROXY_CONF_FILE CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml up #--build

## Url

PROXY_CONF_FILE=proxy-configuration-traefik-url.yaml
sudo D_CFG_PATH=../$PROXY_CONF_FILE CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml down
node src/index.js config traefik --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/$PROXY_CONF_FILE --authLocation url
sudo D_CFG_PATH=../$PROXY_CONF_FILE CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml up #--build
