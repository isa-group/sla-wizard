PROXY=$1

set -xe

git clone https://github.com/isa-group/sla-gateway-benchmark /tmp/sla-gateway-benchmark

mkdir -p /tmp/generatedSLAs

SLAS_TO_PRODUCE=$2 \
APIKEYS_PER_SLA=$3 \
GENERATED_LOCATION=/tmp/generatedSLAs \
node /tmp/sla-gateway-benchmark/autoSLAs/index.js

echo "# Creating proxy configuration file with sla-wizard for $PROXY" ;
node src/index.js config --authLocation header $PROXY \
			--oas /tmp/sla-gateway-benchmark/specs/simple_api_oas.yaml \
			--sla /tmp/generatedSLAs/ \
			--outFile /tmp/proxy-configuration-file ;
		
echo "# Starting containerized test bed based on Docker-Compose" ;
if [ "$PROXY" = "traefik" ]; then
    D_CFG_PATH=/tmp/proxy-configuration-file CFG_PATH=/tmp/sla-gateway-benchmark/proxies/traefik/traefik.yaml docker-compose \
        --file /tmp/sla-gateway-benchmark/proxies/traefik/docker-compose-traefik.yaml up \
        --detach ;
else
    CFG_PATH=/tmp/proxy-configuration-file docker-compose \
        --file /tmp/sla-gateway-benchmark/proxies/$PROXY/docker-compose-$PROXY.yaml up \
        --detach ;
fi # > /dev/null 2>&1 ;

sleep 4