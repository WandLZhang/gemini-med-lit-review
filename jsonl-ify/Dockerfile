FROM python:3.10

ADD requirements.txt .
RUN pip install -r requirements.txt

#ADD small.xml .
ADD jsonl-ify.py jsonl-ify.xsl .

CMD ["python", "jsonl-ify.py"]
