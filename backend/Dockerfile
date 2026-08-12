FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

RUN chmod +x docker-entrypoint.sh

CMD ["./docker-entrypoint.sh"]
