# Envoy

## Header

```bash
sudo CFG_PATH=../proxy-configuration-envoy.yaml docker-compose --file tests/envoy/docker-compose-envoy.yaml down
node src/index.js config envoy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-envoy.yaml
sudo CFG_PATH=../proxy-configuration-envoy.yaml docker-compose --file tests/envoy/docker-compose-envoy.yaml up --build
gio trash tests/proxy-configuration-envoy.yaml
```

## Query

```bash
sudo CFG_PATH=../proxy-configuration-envoy.yaml docker-compose --file tests/envoy/docker-compose-envoy.yaml down
node src/index.js config envoy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-envoy.yaml --authLocation query
sudo CFG_PATH=../proxy-configuration-envoy.yaml docker-compose --file tests/envoy/docker-compose-envoy.yaml up --build
gio trash tests/proxy-configuration-envoy.yaml
```

## Url

```bash
sudo CFG_PATH=../proxy-configuration-envoy.yaml docker-compose --file tests/envoy/docker-compose-envoy.yaml down
node src/index.js config envoy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-envoy.yaml --authLocation url
sudo CFG_PATH=../proxy-configuration-envoy.yaml docker-compose --file tests/envoy/docker-compose-envoy.yaml up --build
gio trash tests/proxy-configuration-envoy.yaml
```

---

# HAProxy

## Header

```bash
sudo CFG_PATH=../proxy-configuration-haproxy docker-compose --file tests/haproxy/docker-compose-haproxy.yaml down
node src/index.js config haproxy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-haproxy
sudo CFG_PATH=../proxy-configuration-haproxy docker-compose --file tests/haproxy/docker-compose-haproxy.yaml up --build
gio trash tests/proxy-configuration-haproxy
```

## Query

```bash
sudo CFG_PATH=../proxy-configuration-haproxy docker-compose --file tests/haproxy/docker-compose-haproxy.yaml down
node src/index.js config haproxy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-haproxy --authLocation query
sudo CFG_PATH=../proxy-configuration-haproxy docker-compose --file tests/haproxy/docker-compose-haproxy.yaml up --build
gio trash tests/proxy-configuration-haproxy
```

## Url

```bash
sudo CFG_PATH=../proxy-configuration-haproxy docker-compose --file tests/haproxy/docker-compose-haproxy.yaml down
node src/index.js config haproxy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-haproxy --authLocation url
sudo CFG_PATH=../proxy-configuration-haproxy docker-compose --file tests/haproxy/docker-compose-haproxy.yaml up --build
gio trash tests/proxy-configuration-haproxy
```

---

# NGINX

## Header

```bash
sudo CFG_PATH=../proxy-configuration-nginx docker-compose --file tests/nginx/docker-compose-nginx.yaml down
node src/index.js config nginx --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-nginx
sudo CFG_PATH=../proxy-configuration-nginx docker-compose --file tests/nginx/docker-compose-nginx.yaml up --build
gio trash tests/proxy-configuration-nginx
```

## Query

```bash
sudo CFG_PATH=../proxy-configuration-nginx docker-compose --file tests/nginx/docker-compose-nginx.yaml down
node src/index.js config nginx --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-nginx --authLocation query
sudo CFG_PATH=../proxy-configuration-nginx docker-compose --file tests/nginx/docker-compose-nginx.yaml up --build
gio trash tests/proxy-configuration-nginx
```

## Url

```bash
sudo CFG_PATH=../proxy-configuration-nginx docker-compose --file tests/nginx/docker-compose-nginx.yaml down
node src/index.js config nginx --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-nginx --authLocation url
sudo CFG_PATH=../proxy-configuration-nginx docker-compose --file tests/nginx/docker-compose-nginx.yaml up --build
gio trash tests/proxy-configuration-nginx
```

---
# TRAEFIK

## Header

```bash
sudo D_CFG_PATH=../proxy-configuration-traefik.yaml CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml down
node src/index.js config traefik --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-traefik.yaml
sudo D_CFG_PATH=../proxy-configuration-traefik.yaml CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml up --build
gio trash tests/proxy-configuration-traefik.yaml
```

## Query

```bash
sudo D_CFG_PATH=../proxy-configuration-traefik.yaml CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml down
node src/index.js config traefik --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-traefik.yaml --authLocation query
sudo D_CFG_PATH=../proxy-configuration-traefik.yaml CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml up --build
gio trash tests/proxy-configuration-traefik.yaml
```

## Url

```bash
sudo D_CFG_PATH=../proxy-configuration-traefik.yaml CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml down
node src/index.js config traefik --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-traefik.yaml --authLocation url
sudo D_CFG_PATH=../proxy-configuration-traefik.yaml CFG_PATH=./traefik.yaml docker-compose --file tests/traefik/docker-compose-traefik.yaml up --build
gio trash tests/proxy-configuration-traefik.yaml
```