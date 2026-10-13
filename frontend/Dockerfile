FROM node:20-alpine

WORKDIR /app

# Instalamos los paquetes de Node
COPY package*.json ./
RUN npm install

# Copiamos todo el código del frontend
COPY . .
