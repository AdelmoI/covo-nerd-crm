FROM node:20-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci --production=false

# Copia tutto
COPY . .

# Build Next.js
RUN npm run build

# Pulisci dipendenze dev
RUN npm prune --production

EXPOSE 3000

CMD ["npm", "start"]