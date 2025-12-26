# ---------- Build ----------
FROM node:20 AS build

WORKDIR /app

# argument Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

# ---------- Production ----------
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
