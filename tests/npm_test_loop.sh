#!/bin/bash

RESTART_PROXY=0
LOGS_FILE=/tmp/test
ITERATIONS=20

for SLEEP_TIME in 0 0.25 0.5 1; do
    for i in $(eval echo "{1..$ITERATIONS}"); do
        npm test; 
        sleep $SLEEP_TIME; 
        if [[ $RESTART_PROXY = 1 ]]; then
            sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/envoy/docker-compose-envoy.yaml down
            sudo CFG_PATH=../$PROXY_CONF_FILE docker-compose --file tests/envoy/docker-compose-envoy.yaml up -d
            sleep 2
        fi
    done | grep "to equal 450\|Received 200s: 450" | sed 's/AssertionError: expected //g' | sed 's/ to equal 450//g' | sed 's/Received 200s://g' &> $LOGS_FILE"_sleep"$SLEEP_TIME
done