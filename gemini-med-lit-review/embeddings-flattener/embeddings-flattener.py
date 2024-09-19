import os
import json
import pandas as pd

def process():
    index = int(os.environ.get("BATCH_TASK_INDEX", "-1"))

    if index == -1:
        #in_file = "small.jsonl"
        #out_file = "small_embeddings.jsonl"
        in_file = "000000000000.jsonl"
        out_file = "000000000000_embeddings_flattened.jsonl"
    else:
        file_index = str(index+1).zfill(4)
        
        in_file = "/mnt/disks/<your-project-id>-embeddings-jsonl/pubmed24n" + file_index + ".jsonl"
        out_file = "/mnt/disks/<your-project-id>-embeddings/pubmed24n" + file_index + ".jsonl"
    print(in_file)
    print(out_file)


    df = pd.read_json(in_file, lines=True)
    df = df.apply(transform_data, axis=1)
    #print(df[0])
    
    with open(out_file, "w") as f:
        f.write(df.to_json(orient='records', lines=True))
    
    print(df.info())

def transform_data(row):
    return {
        "id": row['instance']['id'],
        "title": row['instance']['title'],
        "doi": row['instance']['doi'],
        "abstract": row['instance']['content'],
        "embedding": row['predictions'][0]['embeddings']['values']
    }


if __name__ == "__main__":
    process()
