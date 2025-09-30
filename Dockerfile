FROM node:20-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci --omit=dev

# Copia tutto il progetto
COPY . .

# SALTA IL BUILD - Lo faremo a runtime
# Questo evita problemi con le variabili d'ambiente

EXPOSE 3000

# Build e start a runtime quando le variabili sono disponibili
CMD ["sh", "-c", "npm run build && npm start"]