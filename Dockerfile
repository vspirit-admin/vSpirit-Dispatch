FROM node:16

ENV NODE_ENV=local
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "."]