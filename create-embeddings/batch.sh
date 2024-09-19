curl -X POST \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d @batch-gecko-request.json \
    "https://us-central1-aiplatform.googleapis.com/v1/projects/<your-project-id>/locations/us-central1/batchPredictionJobs"
