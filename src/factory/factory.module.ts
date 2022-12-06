import { Module } from '@nestjs/common';
import { FactoryService } from './factory.service';

@Module({
  providers: [FactoryService],
  exports: [FactoryService],
})
export class FactoryModule {}
