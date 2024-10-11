#!/bin/bash

npm run build

gcloud builds submit --tag gcr.io/[PROJECT_ID]/medical-assistant

gcloud run deploy medical-assistant --image gcr.io/[PROJECT_ID]/medical-assistant --platform managed --allow-unauthenticated