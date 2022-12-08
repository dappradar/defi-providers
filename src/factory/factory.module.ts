import { Module } from '@nestjs/common';
import { FactoryService } from './factory.service';
import { Web3ProviderModule } from '../web3Provider/web3Provider.module';

@Module({
  imports: [Web3ProviderModule],
  providers: [FactoryService],
  exports: [FactoryService],
})
export class FactoryModule {}
