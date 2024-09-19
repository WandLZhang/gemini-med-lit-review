#!/bin/bash

docker build -t us-central1-docker.pkg.dev/<your-project-id>/docker/frontend .

docker push us-central1-docker.pkg.dev/<your-project-id>/docker/frontend

# TODO add the CloudSQL config in here?
gcloud run deploy frontend \
    --image us-central1-docker.pkg.dev/<your-project-id>/docker/frontend \
    --region us-central1 \
    --allow-unauthenticated