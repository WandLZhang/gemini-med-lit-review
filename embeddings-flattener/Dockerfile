FROM python:3.10

ADD requirements.txt .
RUN pip install -r requirements.txt

ADD embeddings-flattener.py .

CMD ["python", "embeddings-flattener.py"]
