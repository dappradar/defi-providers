import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FactoryModule } from './factory/factory.module';

@Module({
  imports: [FactoryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
