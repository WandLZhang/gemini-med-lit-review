# Medical Research Assistant Demo based on Prinses Máxima Centrum MVP

Credit to Máxima team and jmbrinkman@google.com, templatized by Google Public Sector Rapid Innovation Team (RIT)

## 1. Copy the PubMed embeddings
We are using the annual baseline of MEDLINE citations as of 2024-09-13, but in the future we could also add the daily update files (see https://pubmed.ncbi.nlm.nih.gov/download).

Make your buckets for storing the embeddings:

    # Set the project ID variable
    export PROJECT_ID="your-project-id" // Replace with your actual project ID

    # Bucket for embeddings of JSONified PubMed abstracts
    gsutil mb -c regional -l us-central1 -p "$PROJECT_ID" gs://"${PROJECT_ID}-embeddings"

    # Bucket for embeddings from Postgres of PubMed abstracts
    gsutil mb -c regional -l us-central1 -p "$PROJECT_ID" gs://"${PROJECT_ID}-ids-and-embeddings-from-postgres-us-central1"

    # Bucket for loading PubMed abstracts into Postgres
    gsutil mb -p "$PROJECT_ID" gs://"${PROJECT_ID}-embeddings-input" 

Use these commands to directly copy the embeddings, then skip to the next step:

    gsutil -m cp -r gs://rit-pubmed-embeddings/* gs://"${PROJECT_ID}-embeddings"

    gsutil -m cp -r gs://rit-pubmed-ids-and-embeddings-from-postgres-us-central1/* gs://"${PROJECT_ID}-ids-and-embeddings-from-postgres-us-central1"

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

## 2. Create embeddings and load them into Postgres
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

## 3. Write the embeddings from Postgres to GCS

Skip this step if you already copied the gs://rit-pubmed-ids-and-embeddings-from-postgres-us-central1 bucket from step1

    cd postgres-to-gcs

    source .env

    docker build -t us-central1-docker.pkg.dev/${PROJECT_ID}/docker/postgres-to-gcs .

    docker push us-central1-docker.pkg.dev/${PROJECT_ID}/docker/postgres-to-gcs

    gcloud batch jobs submit postgres-to-gcs \
    --location us-central1 \
    --config postgres-to-gcs-job.json

## 4. Import the embeddings into Vector Search

    cd ..
    
    gcloud ai indexes create \
        --metadata-file=create-index.json \
        --display-name=pubmed-index-postgres \
        --region=us-central1 \
        --project=<your-project-id>

These steps are easier to do in Vector Search UI (one click):

    gcloud ai index-endpoints create \
    --display-name=pubmed-endpoint-postgres \
    --public-endpoint-enabled \
    --region=us-central1

    gcloud ai index-endpoints deploy-index <ID> \
    --deployed-index-id=DEPLOYED_INDEX_ID \
    --display-name=pubmed-endpoint-postgres \
    --index=INDEX_ID \
    --region=us-central1

## 5. Deploy Backend
Deploy the backends to Cloud Functions.

    cd .. && cd backend/generate-medical-case
    
In `main.py` replace the parameters in the vertexai.init

    gcloud functions deploy generate-medical-case \
    --region us-central1 \
    --runtime python312 \
    --trigger-http \
    --allow-unauthenticated \
    --memory 1GiB \
    --cpu 1 \
    --timeout 1200s \
    --entry-point medical_research_assistant \
    --source main.py

    gcloud functions add-invoker-policy-binding generate-medical-case \
      --region="us-central1" \
      --member="allUsers"

Moving to the next file

    cd .. && cd medical-research-assistant

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

## 6. Deploy Frontend
Change directory:

    cd .. && cd frontend

Confirm npm, Node.js, and Firebase CLI are installed.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your existing ${PROJECT_ID}
3. Enable required services:
   - Authentication
     - Go to Authentication > Sign-in method
     - Enable Google Authentication
   - Firestore Database
     - Go to Firestore Database
     - Create database
     - Select production (or test mode)
     - Choose a location

4. In the Firebase Console, get your web app credentials:
   - Click the gear icon next to "Project Overview"
   - Click "Project settings"
   - Under "Your apps", click the web icon (</>)
   - Register your app
   - Note the firebaseConfig values for the next step

5. Rename the `.env.example` to `.env` and fill these out:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

6. Install dependencies
```bash
npm install
```

7. Initialize Firebase in your project
```bash
firebase login
firebase init
```

8. During Firebase initialization:
   - Select these features:
     - Hosting
   - Choose `build` as your public directory
   - Configure as single-page app
   - Don't overwrite existing files

9. Update your firestore.rules, easiest in Firebase console:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chats/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

10. In Firebase Console, go to Authentication
11. Set up Google sign-in method
12. Add authorized domains for OAuth redirects

13. Local Development
```bash
npm start
```

14. Build your project:
```bash
npm run build
```

15. Deploy to Firebase:
```bash
firebase deploy
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.