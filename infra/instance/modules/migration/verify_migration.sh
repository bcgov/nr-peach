#!/bin/bash
set -e
TIMEOUT=600
INTERVAL=5
ELAPSED=0
RG_NAME="$1"
CG_NAME="$2"
CONTAINER_NAME="$3"

while true; do
  STATUS=$(az container show --resource-group "$RG_NAME" --name "$CG_NAME" --query "containers[0].instanceView.currentState.state" -o tsv)
  if [ "$STATUS" = "Terminated" ]; then
    break
  fi
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "Timed out waiting for container to finish"
    echo "----- Container Logs -----"
    az container logs --resource-group "$RG_NAME"  --name "$CG_NAME"  --container-name "$CONTAINER_NAME" || true
    echo "--------------------------"
    exit 1
  fi
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))
done

EXIT_CODE=$(az container show --resource-group "$RG_NAME" --name "$CG_NAME" --query "containers[0].instanceView.currentState.exitCode" -o tsv)
if [ "$EXIT_CODE" != "0" ]; then
  echo "----- Container Logs -----"
  az container logs --resource-group "$RG_NAME"  --name "$CG_NAME"  --container-name "$CONTAINER_NAME" || true
  echo "--------------------------"
  echo "Migration failed with exit code $EXIT_CODE"
  exit 1
fi
