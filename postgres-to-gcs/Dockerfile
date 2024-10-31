FROM python:3.10

# Add requirements first to leverage Docker cache
ADD requirements.txt .
RUN pip install -r requirements.txt

# Add application files
ADD postgres-to-gcs.py .

# The environment variables will be provided at runtime through the Batch job config
ENV DB_CONNECTION_NAME=""
ENV DB_USER=""
ENV DB_PASSWORD=""
ENV DB_NAME=""

CMD ["python", "postgres-to-gcs.py"]