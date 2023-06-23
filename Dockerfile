FROM --platform=linux/amd64 node:18-alpine as builder

RUN apk --no-cache upgrade && \
    apk --no-cache add protoc

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM --platform=linux/amd64 node:18-alpine

WORKDIR /usr/src/app

# TODO: optimize this part further, as it makes image big
COPY package*.json ./
RUN npm install --production

COPY --from=builder /usr/src/app/dist/ dist/
COPY --from=builder /usr/src/app/proto/ proto/

EXPOSE 3002

CMD [ "node", "dist/main.js" ]
