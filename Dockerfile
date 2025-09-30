FROM node:20-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa TUTTE le dipendenze (incluse dev per il build)
RUN npm ci

# Copia tutto il progetto
COPY . .

# Build a runtime (quando le variabili sono disponibili)
# e poi avvia il server
CMD ["sh", "-c", "npm run build && npm start"]