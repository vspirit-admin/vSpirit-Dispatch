FROM debian:bullseye as builder

ARG NODE_VERSION=16.18.1

RUN apt-get update; apt install -y curl
RUN curl https://get.volta.sh | bash
ENV VOLTA_HOME /root/.volta
ENV PATH /root/.volta/bin:$PATH
RUN volta install node@${NODE_VERSION}

RUN mkdir /app
WORKDIR /app

COPY .. .

RUN npm ci --production=false && npm run build -- --sourceMap false

###################################################################

FROM debian:bullseye

LABEL fly_launch_runtime="nodejs"

COPY --from=builder /root/.volta /root/.volta
RUN mkdir /app
COPY --from=builder /app/package*.json /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/database /app/database

WORKDIR /app
ENV PATH /root/.volta/bin:$PATH

RUN npm ci --omit=dev

CMD [ "npm", "run", "start" ]




