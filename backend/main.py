import os
import requests
import vertexai
from langchain.memory import ConversationBufferMemory
from langchain.callbacks.base import BaseCallbackHandler
from langchain_google_vertexai import ChatVertexAI, HarmBlockThreshold, HarmCategory, VertexAI
from langchain_google_vertexai import VertexAIEmbeddings
from langchain_google_vertexai import VectorSearchVectorStore
from langchain_google_vertexai.vectorstores.vectorstores import _BaseVertexAIVectorStore
from langchain_google_vertexai.vectorstores._sdk_manager import VectorSearchSDKManager
from langchain_google_vertexai.vectorstores._searcher import VectorSearchSearcher
from langchain_google_vertexai.vectorstores._document_storage import DocumentStorage
from typing import Any, Dict, Optional, Type, List
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
import pg8000
from google.cloud.sql.connector import Connector, IPTypes
import functions_framework
from flask import jsonify, request
from flask_cors import CORS

# Initialize Vertex AI with your project ID
vertexai.init(project="<your-project-id>")

class VectorSearchVectorStorePostgres(_BaseVertexAIVectorStore):
    """VectorSearch with Postgres document storage."""

    @classmethod
    def from_components(
        cls: Type["VectorSearchVectorStorePostgres"],
        project_id: str,
        region: str,
        index_id: str,
        endpoint_id: str,
        pg_instance_connection_string: str,
        pg_user: str,
        pg_password: str,
        pg_db: str,
        pg_collection_name: str,
        embedding: Optional[Embeddings] = None,
        **kwargs: Dict[str, Any],
    ) -> "VectorSearchVectorStorePostgres":

        sdk_manager = VectorSearchSDKManager(
            project_id=project_id, region=region
        )

        index = sdk_manager.get_index(index_id=index_id)
        endpoint = sdk_manager.get_endpoint(endpoint_id=endpoint_id)

        document_storage = PostgresDocumentStorage(
            instance_connection_string=pg_instance_connection_string,
            user=pg_user,
            password=pg_password,
            db=pg_db,
            collection_name=pg_collection_name,
        )

        return cls(
            document_storage=document_storage,
            searcher=VectorSearchSearcher(
                endpoint=endpoint,
                index=index,
            ),
            embbedings=embedding,
        )

class PostgresDocumentStorage(DocumentStorage):
    """Stores documents in Google CloudSQL Postgres."""

    def __init__(
        self,
        instance_connection_string: str,
        user: str,
        password: str,
        db: str,
        collection_name: str
    ) -> None:
        super().__init__()
        self._collection_name = collection_name

        self._conn: pg8000.dbapi.Connection = Connector().connect(
            instance_connection_string,
            "pg8000",
            user=user,
            password=password,
            db=db,
            ip_type=IPTypes.PUBLIC,
        )

    def get_by_id(self, document_id: str) -> Document | None:
        """Gets the text of a document by its id. If not found, returns None."""
        print("get_by_id", document_id)

        cursor = self._conn.cursor()
        cursor.execute("SELECT id, title, abstract FROM articles WHERE id = %s", (document_id,))
        result = cursor.fetchone()
        cursor.close()
        print("result", result)

        if result is None:
            return None
 
        return Document(
            page_content=result[2],
            metadata={
                "id": result[0],
                "title": result[1]
            },
        )

    def store_by_id(self, document_id: str, document: Document):
        raise NotImplementedError()

def configure_vector_store():
    embeddings = VertexAIEmbeddings("textembedding-gecko@003")

    vector_store = VectorSearchVectorStorePostgres.from_components(
        project_id="<your-project-id>",
        region="us-central1",
        index_id="<vector search index id>",
        endpoint_id="projects/<project #>/locations/us-central1/indexEndpoints/<index endpoint id>",
        pg_instance_connection_string="<your-project-id>:us-central1:pubmed-postgres",
        pg_user="postgres",
        pg_password="(your password)",
        pg_db="pubmed",
        pg_collection_name="articles",
        embedding=embeddings,
    )

    return vector_store

def configure_llm():
    return ChatVertexAI(
        model_name="gemini-1.5-pro-preview-0409",
        convert_system_message_to_human=True,
        safety_settings={
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_UNSPECIFIED: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
    )

def configure_qa_chain(retriever, llm, template_content):
    prompt = ChatPromptTemplate.from_template(template_content)

    setup_and_retrieval = RunnableParallel(
        {"abstracts": retriever, "question": RunnablePassthrough()}
    )

    return setup_and_retrieval | prompt | llm

def process_query(query, template_content):
    vector_store = configure_vector_store()
    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 10})
    llm = configure_llm()
    qa_chain = configure_qa_chain(retriever, llm, template_content)

    response = qa_chain.invoke(query)
    
    print("Markdown content sent to frontend:")
    print(response.content)
    print("End of markdown content")
    
    return response.content

def retrieve_documents(query):
    vector_store = configure_vector_store()
    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 10})
    docs = list(retriever.get_relevant_documents(query))
    return [{"title": doc.metadata.get('title', 'No title'), "content": doc.page_content} for doc in docs]

@functions_framework.http
def medical_research_assistant(request):
    """HTTP Cloud Function."""
    # Configure CORS
    cors = CORS(
        origins=[
            "http://localhost:3000",
            "<your cloud run url>"
        ],
        methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        supports_credentials=True,
        max_age=3600
    )
    
    # Handle preflight request
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": request.headers.get("Origin", "*"),
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600"
        }
        return ("", 204, headers)

    # Apply CORS to the main request
    headers = {
        "Access-Control-Allow-Origin": request.headers.get("Origin", "*"),
        "Access-Control-Allow-Credentials": "true"
    }

    # Get the query from the request
    request_json = request.get_json(silent=True)
    request_args = request.args

    if request_json and 'query' in request_json:
        query = request_json['query']
    elif request_args and 'query' in request_args:
        query = request_args['query']
    else:
        return (jsonify({'error': 'No query provided'}), 400, headers)

    # Check if it's a request for documents or analysis
    if request_args.get('type') == 'documents':
        docs = retrieve_documents(query)
        return (jsonify({'documents': docs}), 200, headers)
    elif request_args.get('type') == 'analysis':
        if request.method == 'POST' and request_json:
            template_content = request_json.get('template', '')
            analysis = process_query(query, template_content)
            return (jsonify({'analysis': analysis}), 200, headers)
        else:
            return (jsonify({'error': 'Invalid request for analysis'}), 400, headers)
    else:
        return (jsonify({'error': 'Invalid request type'}), 400, headers)

# The following code will not be executed in Cloud Functions environment
if __name__ == "__main__":
    query = "asian americans and cancer"
    docs = retrieve_documents(query)
    print("Retrieved documents:", docs)
    analysis = process_query(query, "Default template content")
    print("Analysis:", analysis)
