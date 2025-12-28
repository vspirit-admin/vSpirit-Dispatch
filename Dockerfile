FROM node:16.18.1

ENV NODE_ENV=local
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "."]