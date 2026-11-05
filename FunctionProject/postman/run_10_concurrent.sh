#!/usr/bin/env bash
# Script para enviar 10 peticiones concurrentes reales con Newman hacia Azure Functions
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COLLECTION="$DIR/ARSW_LOAD-BALANCING_AZURE_II.postman_collection.json"
ENV_FILE="$DIR/[ARSW_LOAD-BALANCING_AZURE_II].postman_environment.json"

echo "=================================================================="
echo " Lanzando 10 peticiones concurrentes con Newman a Azure Functions"
echo "=================================================================="
START_TIME=$(date +%s)

for i in {1..10}; do
    newman run "$COLLECTION" -e "$ENV_FILE" --color on > "/tmp/newman_run_$i.log" 2>&1 &
done

wait
END_TIME=$(date +%s)

for i in {1..10}; do
    echo "------------------- Petición Concurrente #$i -------------------"
    grep -E "Fibonacci Serverless|POST https|iterations|requests|test-scripts|assertions|total run duration|average response time" "/tmp/newman_run_$i.log" || cat "/tmp/newman_run_$i.log"
done

echo "=================================================================="
echo " Tiempo total de las 10 peticiones concurrentes: $((END_TIME - START_TIME)) s"
echo "=================================================================="
