FROM python:3

WORKDIR /api
COPY . /api

RUN chmod 1777 /tmp
RUN pip3 install -r requirements.txt
CMD ["python3", "./app.py"]
