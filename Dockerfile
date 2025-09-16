# Estágio de construção
FROM node:22 AS builder

WORKDIR /app

# Copiar apenas o package.json e instalar dependências
COPY package.json ./
RUN npm install

# Copiar o restante do código e construir o projeto
COPY . .
RUN npm run build

# Estágio final
FROM nginx:alpine

# Copiar os arquivos construídos para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor a porta padrão do Nginx
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]