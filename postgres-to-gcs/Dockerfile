FROM python:3.10

ADD requirements.txt .
RUN pip install -r requirements.txt

ADD postgres-to-gcs.py .

CMD ["python", "postgres-to-gcs.py"]
