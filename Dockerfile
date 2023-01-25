FROM --platform=linux/amd64 node:16.10.0-alpine as builder

RUN apk --no-cache upgrade && \
    apk --no-cache add protoc

WORKDIR /usr/src/app
COPY .git/ ./.git/
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM --platform=linux/amd64 node:16.10.0-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/ /usr/src/app/
CMD [ "node", "dist/main.js" ]
