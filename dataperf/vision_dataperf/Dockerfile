FROM python:3.8
COPY ./app ./app
COPY ./requirements.txt ./requirements.txt
RUN pip install -r ./requirements.txt
EXPOSE 81
CMD ["uvicorn", "app.app:app", "--host", "0.0.0.0", "--port", "81"]
