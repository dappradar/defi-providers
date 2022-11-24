import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConifg } from './app.config';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const URI = `${appConifg.HOST}:${appConifg.PORT}`;
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      url: URI,
      package: appConifg.DEFI_PROVIDERS_SERVICE_PACKAGE,
      protoPath: appConifg.DEFI_PROVIDERS_SERVICE_PROTOFILE,
    },
  });
  await app.listen();
  Logger.log(`Microservice is listening on ${URI}`);
}
bootstrap();
