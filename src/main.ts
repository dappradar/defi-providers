import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './app.config';
import { log } from './util/logger/logger';

async function bootstrap() {
  const URI = `${config.HOST}:${config.PORT}`;
  const app = await NestFactory.create(AppModule);
  await app.listen(config.PORT);
  log.info({
    message: `Microservice is listening on ${URI}`,
    endpoint: 'bootstrap',
  });
}
bootstrap();
