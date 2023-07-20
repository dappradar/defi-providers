FROM --platform=linux/amd64 node:18-alpine as builder

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM --platform=linux/amd64 node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /usr/src/app/dist/ dist/
EXPOSE 3002

CMD [ "node", "dist/main.js" ]