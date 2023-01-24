FROM --platform=linux/amd64 node:16.10.0-alpine As development

RUN apk --no-cache add curl unzip
RUN apk add --update python2 make g++\
   && rm -rf /var/cache/apk/* \
RUN apk update && apk add --no-cache make protobuf-dev
ENV PROTOC_ZIP=protoc-3.14.0-linux-x86_64.zip
RUN curl -OL https://github.com/protocolbuffers/protobuf/releases/download/v3.14.0/${PROTOC_ZIP}
RUN unzip -o ${PROTOC_ZIP} -d ./proto
RUN chmod 755 -R ./proto/bin
ENV BASE=/usr

RUN cp ./proto/bin/protoc ${BASE}/bin/
RUN cp -R ./proto/include/* ${BASE}/include/

WORKDIR /usr/src/app
COPY .git/ ./.git/
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD [ "node", "dist/main.js" ]
