FROM node:24.12.0

ENV NODE_ENV=local
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "."]