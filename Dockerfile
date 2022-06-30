FROM node:16-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/vspirit

COPY . .
RUN npm ci --include=dev &&\
    npm run build &&\
    npm prune \
COPY dist .

CMD ["node", "."]
