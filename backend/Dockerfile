# Dockerfile para o Backend Node.js
FROM node:18-alpine

WORKDIR /app

# Instala dependências
COPY package.json package-lock.json* ./
RUN npm install

# Copia o código fonte
COPY . .

# Expõe a porta que o servidor usa
EXPOSE 3000

# Variáveis de ambiente padrão
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
