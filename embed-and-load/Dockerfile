FROM python:3.10

ADD requirements.txt .
RUN pip install -r requirements.txt

ADD embed-and-load.py .

CMD ["python", "embed-and-load.py"]
