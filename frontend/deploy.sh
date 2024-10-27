#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | sed 's/\r$//' | awk '/=/ {print $1}')
else 
    echo ".env file not found"
    exit 1
fi

npm run build

gcloud builds submit \
  --substitutions=_REACT_APP_API_BASE_URL="${REACT_APP_API_BASE_URL}",_REACT_APP_GENERATE_CASE_URL="${REACT_APP_GENERATE_CASE_URL}"

gcloud run deploy medical-assistant \
  --image gcr.io/${REACT_APP_PROJECT_ID}/medical-assistant \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL},REACT_APP_GENERATE_CASE_URL=${REACT_APP_GENERATE_CASE_URL}"