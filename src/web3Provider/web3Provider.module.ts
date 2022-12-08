import { Module } from '@nestjs/common';
import { Web3ProviderService } from './web3Provider.service';
import { Everscale } from './everscale';
import { Hedera } from './hedera';
import { Solana } from './solana';
import { Stacks } from './stacks';
import { Near } from './near';
import { Tezos } from './tezos';

@Module({
  exports: [Web3ProviderService],
  providers: [
    Web3ProviderService,
    Everscale,
    Hedera,
    Near,
    Solana,
    Stacks,
    Tezos,
  ],
})
export class Web3ProviderModule {}
