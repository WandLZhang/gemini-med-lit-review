import os
import requests
import streamlit as st
import vertexai
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_message_histories import StreamlitChatMessageHistory
from langchain.callbacks.base import BaseCallbackHandler
from langchain.chains import ConversationalRetrievalChain
from langchain_google_vertexai import ChatVertexAI, HarmBlockThreshold, HarmCategory, VertexAI
from langchain_google_vertexai import VertexAIEmbeddings
#from langchain_community.vectorstores.pgvector import PGVector

# TODO fix this hacky stuff:
from langchain_google_vertexai import VectorSearchVectorStore
from langchain_google_vertexai.vectorstores.vectorstores import _BaseVertexAIVectorStore
from langchain_google_vertexai.vectorstores._sdk_manager import VectorSearchSDKManager
from langchain_google_vertexai.vectorstores._searcher import VectorSearchSearcher
from langchain_google_vertexai.vectorstores._document_storage import DocumentStorage
from typing import Any, Dict, Optional, Type
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
import pg8000
from google.cloud.sql.connector import Connector, IPTypes


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
            ip_type=IPTypes.PUBLIC, # PRIVATE
        )


    def get_by_id(self, document_id: str) -> Document | None:
        """Gets the text of a document by its id. If not found, returns None.
        Args:
            document_id: Id of the document to get from the storage.
        Returns:
            Text of the document if found, otherwise None.
        """
        print("get_by_id", document_id)

        cursor = self._conn.cursor()
        cursor.execute("SELECT id, title, abstract FROM articles WHERE id = %s", (document_id,)) # TODO parameterize
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



page_icon = 'rit-logo.png'
header_image = 'rit-logo.png'

embeddings = VertexAIEmbeddings("textembedding-gecko@003")

vector_store = VectorSearchVectorStorePostgres.from_components(
    project_id="<your-project-id>",
    region="us-central1",
    index_id="<vector search index ID>",
    endpoint_id="projects/<project #>/locations/us-central1/indexEndpoints/<index endpoint ID>",
    pg_instance_connection_string="<your-project-id>:us-central1:pubmed-postgres",
    pg_user="postgres",
    pg_password="(your password)",
    pg_db="pubmed",
    pg_collection_name="articles",
    embedding=embeddings,
)

st.set_page_config(page_title="RIT - Medical Research Assistant", page_icon=page_icon)
st.image(header_image, width=100)

# @st.cache_resource(ttl="1h")
# def configure_retriever():
#     retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": 2})
#     return retriever

class StreamHandler(BaseCallbackHandler):
    def __init__(self, container: st.delta_generator.DeltaGenerator, initial_text: str = ""):
        self.container = container
        self.text = initial_text
        self.run_id_ignore_token = None

    def on_llm_start(self, serialized: dict, prompts: list, **kwargs):
        # Workaround to prevent showing the rephrased question as output
        if prompts[0].startswith("Human"):
            self.run_id_ignore_token = kwargs.get("run_id")

    def on_llm_new_token(self, token: str, **kwargs) -> None:
        if self.run_id_ignore_token == kwargs.get("run_id", False):
            return
        self.text += token
        self.container.markdown(self.text)
    
    def on_llm_end(self, response, **kwargs):
        self.text += response.generations[0][0].text
        self.container.markdown(self.text)


class PrintRetrievalHandler(BaseCallbackHandler):
    def __init__(self, container):
        self.status = container.status("**Context Retrieval**")

    def on_retriever_start(self, serialized: dict, query: str, **kwargs):
        self.status.write(f"**Question:** {query}")
        self.status.update(label=f"**Context Retrieval:** {query}")

    def on_retriever_end(self, documents, **kwargs):
        for idx, doc in enumerate(documents):
            self.status.write(f"**Document {idx}**")
            self.status.markdown(doc.page_content)
        self.status.update(state="complete")


retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 10})

# Setup memory for contextual conversation
msgs = StreamlitChatMessageHistory()
memory = ConversationBufferMemory(memory_key="chat_history", chat_memory=msgs, return_messages=True)

# Setup LLM and QA chain
llm = ChatVertexAI(
    #model_name="gemini-1.0-pro",
    model_name="gemini-1.5-pro-preview-0409",
    convert_system_message_to_human=True,
    safety_settings={
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_UNSPECIFIED: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }
)

# qa_chain = ConversationalRetrievalChain.from_llm(
#     llm, retriever=retriever, memory=memory, verbose=True
# )

# read the prompt template from prompt.txt:
with open("prompt.txt", "r") as f:
    template = f.read()

prompt = ChatPromptTemplate.from_template(template)

setup_and_retrieval = RunnableParallel(
    {"abstracts": retriever, "question": RunnablePassthrough()}
)

qa_chain = setup_and_retrieval | prompt | llm

if len(msgs.messages) == 0 or st.sidebar.button("Clear message history"):
    msgs.clear()
    msgs.add_ai_message("Hello. How can I help you today?")

avatars = {"human": "user", "ai": "assistant"}
for msg in msgs.messages:
    st.chat_message(avatars[msg.type]).write(msg.content)

if user_query := st.chat_input(placeholder="Ask me anything!"):
    st.chat_message("user").write(user_query)

    with st.chat_message("assistant"):
        retrieval_handler = PrintRetrievalHandler(st.container())
        stream_handler = StreamHandler(st.empty())
        # TODO switch to invoke instead of run, but fix the callbacks then:
        #response = qa_chain.run(user_query, callbacks=[retrieval_handler, stream_handler])
        #response = qa_chain.invoke(user_query, callbacks=[retrieval_handler, stream_handler])
        config = {
            'callbacks' : [retrieval_handler, stream_handler]
        }
        response = qa_chain.invoke(user_query, config=config)
