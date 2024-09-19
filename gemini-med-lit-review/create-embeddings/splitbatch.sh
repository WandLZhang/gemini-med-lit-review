#!/bin/bash

for i in {0001..1219}; do
  date
  echo $i

  # Format the number with leading zeros
  formatted_i=$(printf %04d $i) 

  OPERATION=$(curl -sS -X POST \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json; charset=utf-8" \
    --data '{
      "displayName": "embedjob'${formatted_i}'",
      "model": "publishers/google/models/textembedding-gecko@003",
      "inputConfig": {
        "instancesFormat": "jsonl",
        "gcsSource": {
          "uris": [
            "gs://<your-project-id>-embeddings-input/pubmed24n'${formatted_i}'*" 
          ]
        }
      },
      "outputConfig": {
        "predictionsFormat": "jsonl",
        "gcsDestination": {
          "outputUriPrefix": "gs://<your-project-id>-embeddings-jsonl/"
        }
      }
    }' \
    "https://us-central1-aiplatform.googleapis.com/v1/projects/<your-project-id>/locations/us-central1/batchPredictionJobs" | jq -r .name)

  echo $OPERATION

  while true; do
    STATE=$(curl -sS \
      -X GET \
      -H "Authorization: Bearer $(gcloud auth print-access-token)" \
      -H "Content-Type: application/json" \
      "https://us-central1-aiplatform.googleapis.com/v1/$OPERATION" | jq -r .state)

    if [ "$STATE" = "JOB_STATE_FAILED" ]; then
      echo $STATE
      exit
    elif [ "$STATE" = "JOB_STATE_SUCCEEDED" ]; then
      echo $STATE
      break
    elif [ "$STATE" = "JOB_STATE_QUEUED" ]; then
      echo -n Q
    fi
    sleep 10
  done
done