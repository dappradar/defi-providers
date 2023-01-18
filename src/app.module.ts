import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FactoryModule } from './factory/factory.module';
import { GenericInterceptor } from './generic.interceptor';
import { HealthController } from './health/health.controller';

@Module({
  imports: [FactoryModule],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: GenericInterceptor,
    },
  ],
})
export class AppModule {}
