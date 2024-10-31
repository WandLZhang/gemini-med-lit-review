import json
import ast
import os
import pg8000
from google.cloud.sql.connector import Connector, IPTypes
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def process():
    index = int(os.environ.get("BATCH_TASK_INDEX", "-1"))

    if index == -1:
        out_file = "tmp.json"
    else:
        file_index = str(index+1).zfill(4)
        out_file = "/mnt/disks/rit-pubmed-ids-and-embeddings-from-postgres/pubmed" + file_index + ".json"
    print(out_file)

    connector = Connector()
    conn: pg8000.dbapi.Connection = connector.connect(
        os.environ.get("DB_CONNECTION_NAME"),  # "<project-id>:us-central1:pmc-postgres"
        "pg8000",
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        db=os.environ.get("DB_NAME"),
        ip_type=IPTypes.PUBLIC,
    )

    # Rest of your code remains the same
    context = conn.execute_simple("SELECT version()")
    print(context.rows)

    cur = conn.cursor()
    cur.execute("START TRANSACTION")
    cur.execute("DECLARE c SCROLL CURSOR FOR SELECT id, embedding FROM articles ORDER BY id")

    if index > 0:
        cur.execute(f"MOVE FORWARD {index*10000} FROM c")
    cur.execute("FETCH FORWARD 10000 FROM c")
    rows = cur.fetchall()
    if not rows:
        print("No rows")
        exit()
        
    with open(out_file, "w") as f:
        for row in rows:
            f.write(json.dumps({"id": row[0], "embedding": ast.literal_eval(row[1])}) + "\n")
    
    cur.execute("CLOSE c")
    cur.execute("ROLLBACK")
    conn.close()


if __name__ == "__main__":
    process()