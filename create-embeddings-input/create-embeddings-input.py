import os
import json

def process():
    index = int(os.environ.get("BATCH_TASK_INDEX", "-1"))

    if index == -1:
        #in_file = "small.jsonl"
        #out_file = "small_embeddings.jsonl"
        in_file = "pubmed24n0001.jsonl"
        out_file = "pubmed24n0001_embedding_input.jsonl"
    else:
        file_index = str(index+1).zfill(4)
        in_file = "/mnt/disks/<your-project-id>-jsonl/pubmed24n" + file_index + ".jsonl"
        out_file = "/mnt/disks/<your-project-id>-embeddings-input/pubmed24n" + file_index + ".jsonl"
    print(in_file)
    print(out_file)


    with open(in_file, "r") as f:
        lines = f.readlines()

    output = ""
    for line in lines:
        data = json.loads(line)

        if not data["abstract"]:
            continue

        if not data["doi"]:
            continue

        data["id"] = data.pop("_id")
        data["task_type"] = "RETRIEVAL_DOCUMENT"
        data["content"] = data.pop("abstract")

        output += json.dumps(data) + "\n"

    with open(out_file, "w") as f:
        f.write(output)
    
    lines = output.count("\n")
    print(f"Wrote {lines} lines to {out_file}")


if __name__ == "__main__":
    process()
