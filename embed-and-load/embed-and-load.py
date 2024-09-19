import os
import json
import time
import pg8000
import random

from google.cloud.sql.connector import Connector, IPTypes
from vertexai.language_models import TextEmbeddingModel
from google.api_core.exceptions import ResourceExhausted

def process():
    index = int(os.environ.get("BATCH_TASK_INDEX", "-1"))

    if index == -1:
        in_file = "pubmed24n0055.jsonl"
    else:
        file_index = str(index+1).zfill(4)
        in_file = "/mnt/disks/<your-project-id>-embeddings-input/pubmed24n" + file_index + ".jsonl"
    print(in_file)

    with open(in_file, "r") as f:
        lines = f.readlines()


    connector = Connector()
    conn: pg8000.dbapi.Connection = connector.connect(
        "<your-project-id>:us-central1:pubmed-postgres",
        "pg8000",
        #host="localhost", 
        user="postgres",
        password="(your password)",
        db="pubmed",
        ip_type=IPTypes.PUBLIC,
        # ip_type=IPTypes.PRIVATE,
    )

    context = conn.execute_simple("SELECT version()")
    print(context.rows)

    model = TextEmbeddingModel.from_pretrained("textembedding-gecko@003")

    counter = 0
    linesBuffer = []
    for line in lines:
        data = json.loads(line)

        cur = conn.cursor()

        # Check the DB if we already have embeddings for this
        id = data["id"]
        cur.execute("SELECT id FROM articles WHERE id = %s", (id,))
        if cur.rowcount > 0:
            #print(f"skipping {id}")
            continue

        linesBuffer.append(data)
        if len(linesBuffer) == 5: # TODO make this more robust and make sure any remaining lines also get inserted
            retries = 3
            for attempt in range(retries):
                try:
                    vectors = model.get_embeddings([
                        linesBuffer[0]["content"], 
                        linesBuffer[1]["content"], 
                        linesBuffer[2]["content"], 
                        linesBuffer[3]["content"], 
                        linesBuffer[4]["content"]
                    ])
                    break
                except ResourceExhausted as e:
                    if attempt < retries - 1:
                        base_sleep_time = 30 * (2 ** attempt)  # Base backoff
                        random_seconds = random.randint(0, 60)  # Add up to 60 seconds of jitter
                        sleep_time = base_sleep_time + random_seconds 
                        print(f"Quota exceeded. Retrying in {sleep_time/60:.2f} minutes...")
                        time.sleep(sleep_time)
                    else:
                        raise e
                    
            # I'm sorry, please don't kill me:
            cur.execute(
                "INSERT INTO articles (id, title, doi, abstract, embedding) VALUES (%s, %s, %s, %s, %s), (%s, %s, %s, %s, %s), (%s, %s, %s, %s, %s), (%s, %s, %s, %s, %s), (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING",
                (linesBuffer[0]["id"], linesBuffer[0]["title"], linesBuffer[0]["doi"], linesBuffer[0]["content"], str(vectors[0].values),
                linesBuffer[1]["id"], linesBuffer[1]["title"], linesBuffer[1]["doi"], linesBuffer[1]["content"], str(vectors[1].values),
                linesBuffer[2]["id"], linesBuffer[2]["title"], linesBuffer[2]["doi"], linesBuffer[2]["content"], str(vectors[2].values),
                linesBuffer[3]["id"], linesBuffer[3]["title"], linesBuffer[3]["doi"], linesBuffer[3]["content"], str(vectors[3].values), 
                linesBuffer[4]["id"], linesBuffer[4]["title"], linesBuffer[4]["doi"], linesBuffer[4]["content"], str(vectors[4].values)))
            conn.commit()
            linesBuffer = []

        counter += 1
        if counter % 1000 == 0:
            print(counter, flush=True)


if __name__ == "__main__":
    process()
