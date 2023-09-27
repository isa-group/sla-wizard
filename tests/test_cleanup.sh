echo "# Tearing down test bed";

for proxy in envoy haproxy nginx traefik; do
    docker-compose --file /tmp/sla-gateway-benchmark/proxies/$proxy/docker-compose-$proxy.yaml down > /dev/null 2>&1
done

rm -fr /tmp/generatedSLAs /tmp/sla-gateway-benchmark