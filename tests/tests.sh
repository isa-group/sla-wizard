######### Envoy

## Header

sudo CFG_PATH=../proxy-configuration-envoy.yaml docker-compose --file tests/envoy/docker-compose-envoy.yaml down
node src/index.js config envoy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-envoy.yaml
sudo CFG_PATH=../proxy-configuration-envoy.yaml docker-compose --file tests/envoy/docker-compose-envoy.yaml up --build
gio trash tests/proxy-configuration-envoy.yaml

## Query

sudo CFG_PATH=../proxy-configuration-envoy.yaml docker-compose --file tests/envoy/docker-compose-envoy.yaml down
node src/index.js config envoy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-envoy.yaml --authLocation query
sudo CFG_PATH=../proxy-configuration-envoy.yaml docker-compose --file tests/envoy/docker-compose-envoy.yaml up --build
gio trash tests/proxy-configuration-envoy.yaml

## Url

sudo CFG_PATH=../proxy-configuration-envoy.yaml docker-compose --file tests/envoy/docker-compose-envoy.yaml down
node src/index.js config envoy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-envoy.yaml --authLocation url
sudo CFG_PATH=../proxy-configuration-envoy.yaml docker-compose --file tests/envoy/docker-compose-envoy.yaml up --build
gio trash tests/proxy-configuration-envoy.yaml


######### HAProxy

## Header

sudo CFG_PATH=../proxy-configuration-haproxy.cfg docker-compose --file tests/haproxy/docker-compose-haproxy.yaml down
node src/index.js config haproxy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-haproxy.cfg
sudo CFG_PATH=../proxy-configuration-haproxy.cfg docker-compose --file tests/haproxy/docker-compose-haproxy.yaml up --build
gio trash tests/proxy-configuration-haproxy.cfg

## Query

sudo CFG_PATH=../proxy-configuration-haproxy.cfg docker-compose --file tests/haproxy/docker-compose-haproxy.yaml down
node src/index.js config haproxy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-haproxy.cfg --authLocation query
sudo CFG_PATH=../proxy-configuration-haproxy.cfg docker-compose --file tests/haproxy/docker-compose-haproxy.yaml up --build
gio trash tests/proxy-configuration-haproxy.cfg

## Url

sudo CFG_PATH=../proxy-configuration-haproxy.cfg docker-compose --file tests/haproxy/docker-compose-haproxy.yaml down
node src/index.js config haproxy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-haproxy.cfg --authLocation url
sudo CFG_PATH=../proxy-configuration-haproxy.cfg docker-compose --file tests/haproxy/docker-compose-haproxy.yaml up --build
gio trash tests/proxy-configuration-haproxy.cfg


######### NGINX

## Header

sudo CFG_PATH=../proxy-configuration-nginx.conf docker-compose --file tests/nginx/docker-compose-nginx.yaml down
node src/index.js config nginx --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-nginx.conf
sudo CFG_PATH=../proxy-configuration-nginx.conf docker-compose --file tests/nginx/docker-compose-nginx.yaml up --build
gio trash tests/proxy-configuration-nginx.conf

## Query

sudo CFG_PATH=../proxy-configuration-nginx.conf docker-compose --file tests/nginx/docker-compose-nginx.yaml down
node src/index.js config nginx --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-nginx.conf --authLocation query
sudo CFG_PATH=../proxy-configuration-nginx.conf docker-compose --file tests/nginx/docker-compose-nginx.yaml up --build
gio trash tests/proxy-configuration-nginx.conf

## Url

sudo CFG_PATH=../proxy-configuration-nginx.conf docker-compose --file tests/nginx/docker-compose-nginx.yaml down
node src/index.js config nginx --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-nginx.conf --authLocation url
sudo CFG_PATH=../proxy-configuration-nginx.conf docker-compose --file tests/nginx/docker-compose-nginx.yaml up --build
gio trash tests/proxy-configuration-nginx.conf


######### TRAEFIK

## Header

sudo D_CFG_PATH=../proxy-configuration-traefik.yaml CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml down
node src/index.js config traefik --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-traefik.yaml
sudo D_CFG_PATH=../proxy-configuration-traefik.yaml CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml up --build
gio trash tests/proxy-configuration-traefik.yaml

## Query

sudo D_CFG_PATH=../proxy-configuration-traefik.yaml CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml down
node src/index.js config traefik --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-traefik.yaml --authLocation query
sudo D_CFG_PATH=../proxy-configuration-traefik.yaml CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml up --build
gio trash tests/proxy-configuration-traefik.yaml

## Url

sudo D_CFG_PATH=../proxy-configuration-traefik.yaml CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml down
node src/index.js config traefik --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-traefik.yaml --authLocation url
sudo D_CFG_PATH=../proxy-configuration-traefik.yaml CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml up --build
gio trash tests/proxy-configuration-traefik.yaml
