# ---------- Build ----------
FROM node:20 AS build

WORKDIR /app
<<<<<<< HEAD
=======

# argument Vite
>>>>>>> 58aa0961e63818f210f9f6ab34fc25a3de8a2353
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

# ---------- Production ----------
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
