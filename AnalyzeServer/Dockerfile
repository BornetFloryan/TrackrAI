FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV WS_HOST=0.0.0.0
ENV WS_PORT=6000
ENV CENTRAL_HOST=trackr-central
ENV CENTRAL_PORT=9000
ENV CENTRAL_ENABLED=1
ENV ANALYSIS_TYPE=SPORT

EXPOSE 6000

CMD ["python", "main.py"]
