import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './app.config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { log } from './util/logger/logger';

async function bootstrap() {
  const URI = `${config.HOST}:${config.PORT}`;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        url: URI,
        package: config.DEFI_PROVIDERS_SERVICE_PACKAGE,
        protoPath: config.DEFI_PROVIDERS_SERVICE_PROTOFILE,
        channelOptions: {
          'grpc.max_send_message_length': 1024 * 1024 * 1024,
          'grpc.max_receive_message_length': 1024 * 1024 * 1024,
          'grpc.max_concurrent_streams': 10,
        },
      },
    },
  );
  await app.listen();
  log.info({
    message: `Microservice is listening on ${URI}`,
    endpoint: 'bootstrap',
  });
}
bootstrap();
