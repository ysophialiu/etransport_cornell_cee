FROM python:3

WORKDIR /api
COPY ./requirements.txt /api

RUN chmod 1777 /tmp
RuN apt-get update
RUN apt-get install -y gdal-bin libgdal-dev
RUN pip3 install -r requirements.txt
CMD ["python3", "./app.py"]
