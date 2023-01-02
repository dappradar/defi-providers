import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './app.config';
import { Transport } from '@nestjs/microservices';
import { log } from './util/logger/logger';

async function bootstrap() {
  const URI = `${config.HOST}:${config.PORT}`;
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      url: URI,
      package: config.DEFI_PROVIDERS_SERVICE_PACKAGE,
      protoPath: config.DEFI_PROVIDERS_SERVICE_PROTOFILE,
    },
  });
  await app.listen();
  log.info({
    message: `Microservice is listening on ${URI}`,
    endpoint: 'bootstrap',
  });
}
bootstrap();
