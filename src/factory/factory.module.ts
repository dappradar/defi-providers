import { Module } from '@nestjs/common';
import { FactoryService } from './factory.service';

@Module({
  providers: [FactoryService],
})
export class FactoryModule {}
