FROM node:20-bookworm

WORKDIR /app

RUN apt-get update \
 && apt-get install -y python3 python3-venv python3-pip \
 && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY package*.json ./
RUN npm install

COPY ai/requirements.txt ./ai/requirements.txt
RUN pip install --no-cache-dir -r ./ai/requirements.txt

COPY . .

EXPOSE 4567

CMD ["npm", "start"]
