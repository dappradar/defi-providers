FROM --platform=linux/amd64 node:14 As development

ENV PROTOC_ZIP=protoc-3.14.0-linux-x86_64.zip
RUN curl -OL https://github.com/protocolbuffers/protobuf/releases/download/v3.14.0/${PROTOC_ZIP}
RUN unzip -o ${PROTOC_ZIP} -d ./proto
RUN chmod 755 -R ./proto/bin
RUN GRPC_HEALTH_PROBE_VERSION=v0.4.13 && \
    wget -qO/bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe
ENV BASE=/usr

RUN cp ./proto/bin/protoc ${BASE}/bin/
RUN cp -R ./proto/include/* ${BASE}/include/

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm build
CMD [ "node", "dist/main.js" ]
