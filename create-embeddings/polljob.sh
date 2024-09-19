# Run this script to poll the long running operation.
# TODO update the operation id first
curl \
  -X GET \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
https://us-central1-aiplatform.googleapis.com/v1/projects/<your-project-id>/locations/us-central1/batchPredictionJobs/8356541190052511744
