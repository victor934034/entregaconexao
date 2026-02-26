# Dockerfile para o Backend Node.js (Localizado na raiz do monorepo)
FROM node:18-alpine

WORKDIR /app

# Instala dependências a partir da pasta backend
COPY backend/package.json backend/package-lock.json* ./

# Necessário para compilar o bcrypt no Alpine
RUN apk add --no-cache make gcc g++ python3 && \
    npm install && \
    apk del make gcc g++ python3

# Copia o código fonte da pasta backend
COPY backend/ .

# Expõe a porta que o servidor usa
EXPOSE 3000

# Variáveis de ambiente padrão
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
