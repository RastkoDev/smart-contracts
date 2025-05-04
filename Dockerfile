FROM node:21-alpine

RUN apk add --no-cache --upgrade bash

USER node
WORKDIR /home/kinesis-deploy/typescript

COPY typescript/package*.json ./
RUN npm ci --legacy-peer-deps

COPY --chown=node:node pact ../pact
COPY --chown=node:node typescript ./
