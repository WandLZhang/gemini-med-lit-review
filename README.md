# Medical Research Assistant Demo based on Prinses Máxima Centrum MVP

Credit to Máxima team and jmbrinkman@google.com, templatized by Google Public Sector Rapid Innovation Team (RIT)

## 1. Copy the PubMed embeddings
We are using the annual baseline of MEDLINE citations as of 2024-09-13, but in the future we could also add the daily update files (see https://pubmed.ncbi.nlm.nih.gov/download).

Make your buckets for storing the embeddings for Vector Search, as well as another bucket for separate indexing in Postgres (used for article citation retrieval):

    # Set the project ID variable
    export PROJECT_ID="your-project-id" // Replace with your actual project ID

    gsutil mb -c regional -l us-central1 -p "$PROJECT_ID" gs://"${PROJECT_ID}-embeddings"

    gsutil mb -p "$PROJECT_ID" gs://"${PROJECT_ID}-embeddings-input" 

Use these commands to directly copy the embeddings and the Postgres input, then skip to the next step:

    gsutil -m cp -r gs://rit-pubmed-embeddings/* gs://"${PROJECT_ID}-embeddings"

    gsutil -m cp -r gs://rit-pubmed-embeddings-input/* gs://"${PROJECT_ID}-embeddings-input"

## (Optional) Create fresh embeddings
If you would like to manually create your own embeddings, the process will take time. First, create these buckets:

    # Create the buckets
    gsutil mb -p "$PROJECT_ID" gs://"${PROJECT_ID}-datastore" 

    gsutil mb -p "$PROJECT_ID" gs://"${PROJECT_ID}-jsonl"

    gsutil mb -p "$PROJECT_ID" gs://"${PROJECT_ID}-embeddings-jsonl"

Download the compressed .gz files (one hour, best done on a VM > 200 GB):

    cd pubmed && wget -r -e robots=off -nd -P . https://ftp.ncbi.nlm.nih.gov/pubmed/baseline/

Run this script after replacing variable names to extract the files then upload them to your datastore bucket (takes about a day):

    chmod +x upload_pubmed.sh && ./upload_pubmed.sh

The PubMed XML files should be in this format:

    pubmed24n0001.xml
    ...
    pubmed24n1219.xml

We'll now use `jsonl-ify` to convert the XML to JSONL. First, run `setup_network.sh` if there's no network in place. Then go into the directory:

    cd .. && cd jsonl-ify

We'll create a repo for our containers.

    gcloud artifacts repositories create docker \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository"

    gcloud auth configure-docker \
    us-central1-docker.pkg.dev

 Replace the variables in `jsonl-ify.py` and `jsonl-ify-job.json` and run:

    docker build -t us-central1-docker.pkg.dev/<your-project-id>/docker/jsonlifypubmed .

    docker push us-central1-docker.pkg.dev/<your-project-id>/docker/jsonlifypubmed

    gcloud batch jobs submit jsonlifypubmed --location us-central1 --config jsonl-ify-job.json

You'll end up with files like `gs://<your-project-id>-jsonl/pubmed24n0001.jsonl`

The next step is to prepare for embeddings. Replace the variables in create-embeddings-input.py and create-embeddings-input-job.json and run:

    cd .. && cd create-embeddings-input

    docker build -t us-central1-docker.pkg.dev/<your-project-id>/docker/create-embeddings-input .

    docker push us-central1-docker.pkg.dev/<your-project-id>/docker/create-embeddings-input

    gcloud batch jobs submit create-embeddings-input --location us-central1 --config create-embeddings-input-job.json

You'll end up with files like `gs://<your-project-id>-embeddings-input/pubmed24n0001.jsonl`

We'll create the embeddings in jsonl format:

    cd .. && cd create-embeddings
    
    ./splitbatch.sh

After creating the embeddings we need to flatten the JSON structures to be able to load them into Vector Search:

    cd .. && cd embeddings-flattener

    docker build -t us-central1-docker.pkg.dev/<your-project-id>/docker/embeddings-flattener .

    docker push us-central1-docker.pkg.dev/<your-project-id>/docker/embeddings-flattener

    gcloud batch jobs submit embeddings-flatttener --location us-central1 --config embeddings-flattener-job.json

You'll end up with files in `gs://<your-project-id>-embeddings`

## 2. Import embeddings into Vector Search

    cd ..
    
    gcloud ai indexes create \
        --metadata-file=create-index.json \
        --display-name=pubmed-index \
        --region=us-central1 \
        --project=<your-project-id>

These steps are easier to do in Vector Search UI (one click):

    gcloud ai index-endpoints create \
    --display-name=pubmed-endpoint \
    --public-endpoint-enabled \
    --region=us-central1

    gcloud ai index-endpoints deploy-index <ID> \
    --deployed-index-id=DEPLOYED_INDEX_ID \
    --display-name=pubmed-endpoint \
    --index=INDEX_ID \
    --region=us-central1

## 3. Create embeddings and load them into Postgres
Our app will use Postgres to lookup the document names. A future enhancements will be to use BigQuery.

Set up the database:

    cd embed-and-load

    gcloud sql instances create pubmed-postgres \
    --project=gemini-med-lit-review \
    --region=us-central1 \
    --database-version=POSTGRES_16 \
    --cpu=8 \
    --memory=32GB \
    --root-password="(your password)" \
    --network=default

    gcloud sql users set-password postgres --instance=pubmed-postgres password=“(your password)”

Now enter your SQL instance:

    gcloud sql connect pubmed-postgres --user=postgres --quiet

    CREATE DATABASE pubmed;

    \c pubmed

    CREATE EXTENSION vector;

    CREATE TABLE public.articles (
    id TEXT PRIMARY KEY,
    title TEXT,
    doi TEXT,
    abstract TEXT,
    embedding vector(768));

Now we load the database with articles and their embeddings:

    docker build -t us-central1-docker.pkg.dev/<your-project-id>/docker/embed-and-load .

    docker push us-central1-docker.pkg.dev/<your-project-id>/docker/embed-and-load

    gcloud batch jobs submit embed-and-load --location us-central1 --config embed-and-load-job.json

## 4. Deploy Frontend
Deploy the frontend to Cloud Run:

    cd .. && cd frontend
    ./deploy.sh

## 5. Deploy Backend
Deploy the backend to Cloud Functions.

    cd .. && cd backend
    
In `main.py` replace the parameters in the vertexai.init, vector_store instantiation, and update CORS origins with your Cloud Run URL

    gcloud functions deploy medical-research-assistant \
    --region us-central1 \
    --runtime python312 \
    --trigger-http \
    --allow-unauthenticated \
    --memory 8GiB \
    --cpu 8 \
    --timeout 1200s \
    --entry-point medical_research_assistant \
    --source main.py

    gcloud functions add-invoker-policy-binding medical-research-assistant \
      --region="us-central1" \
      --member="allUsers"
