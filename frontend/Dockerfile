FROM python:3.12-slim

WORKDIR /app

# Don't need these on MacOS local build
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    git \
    && rm -rf /var/lib/apt/lists/* 

COPY requirements.txt .
RUN pip install --trusted-host pypi.python.org -r requirements.txt

COPY . .

ENTRYPOINT ["streamlit","run","app.py","--server.port=8080","--server.address=0.0.0.0"]
