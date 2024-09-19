#!/bin/bash

PROJECT_ID="<your-project-id>"  # Replace with your actual project ID
NETWORK_NAME="default"             # Replace if you're using a custom network name

# Create the network (if needed)
gcloud compute networks create $NETWORK_NAME \
    --project=$PROJECT_ID \
    --subnet-mode=auto \
    --mtu=1460 \
    --bgp-routing-mode=regional

# Create firewall rules
gcloud compute firewall-rules create allow-internal \
    --network $NETWORK_NAME \
    --direction INGRESS \
    --priority 65534 \
    --action ALLOW \
    --source-ranges 10.128.0.0/9 \
    --rules tcp:0-65535,udp:0-65535,icmp

gcloud compute firewall-rules create allow-ssh \
    --network $NETWORK_NAME \
    --direction INGRESS \
    --priority 65534 \
    --action ALLOW \
    --source-ranges 0.0.0.0/0 \
    --rules tcp:22

gcloud compute firewall-rules create allow-rdp \
    --network $NETWORK_NAME \
    --direction INGRESS \
    --priority 65534 \
    --action ALLOW \
    --source-ranges 0.0.0.0/0 \
    --rules tcp:3389

gcloud compute firewall-rules create allow-icmp \
    --network $NETWORK_NAME \
    --direction INGRESS \
    --priority 65534 \
    --action ALLOW \
    --source-ranges 0.0.0.0/0 \
    --rules icmp

# Grant Editor role to the Compute Engine default service account (use with caution!)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
    --role="roles/editor"