import { Test, TestingModule } from '@nestjs/testing';
import { FactoryService } from './factory.service';
import { AppModule } from '../app.module';
import { Near } from '../web3Provider/near';
import { Tezos } from '../web3Provider/tezos';

describe(process.argv[6], () => {
  let factoryService: FactoryService;
  let near: Near;
  let tezos: Tezos;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    factoryService = module.get(FactoryService);
    near = module.get(Near);
    tezos = module.get(Tezos);
    await tezos.onModuleInit();
    await near.onModuleInit();
  });
  it(
    process.argv[7],
    async () => {
      const { balances, poolBalances } = await factoryService.getTvl({
        provider: process.argv[7],
        chain: process.argv[6],
        query: { block: process.argv[8], date: '0' },
      });
      console.log('balances:', balances);
      console.log('poolBalances:', poolBalances);
    },
    20000,
  );
});
