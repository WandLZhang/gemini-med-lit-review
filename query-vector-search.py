import pprint

from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel

def get_embedding(text: str) -> list:
    model = TextEmbeddingModel.from_pretrained("textembedding-gecko@003")
    return model.get_embeddings([text])[0].values

def query(vector: list):
    aiplatform.init(project="<your-project-id>", location="us-central1")

    endpoint = aiplatform.MatchingEngineIndexEndpoint(
        index_endpoint_name="5672446458394050560"
    )

    resp = endpoint.find_neighbors(
        deployed_index_id="pubmed_index_1711305283562",
        queries=[vector],
        num_neighbors=5,
        return_full_datapoint=False
    )

    pp = pprint.PrettyPrinter()
    pp.pprint(resp)

if __name__ == "__main__":
    query(get_embedding(text="leukemia"))
