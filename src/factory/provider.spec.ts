import { Test, TestingModule } from '@nestjs/testing';
import { FactoryService } from './factory.service';
import { AppModule } from '../app.module';

describe(process.argv[6], () => {
  let factoryService: FactoryService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    factoryService = module.get(FactoryService);
  });
  it(
    process.argv[7],
    async () => {
      const { balances } = await factoryService.getTvl({
        provider: process.argv[7],
        chain: process.argv[6],
        query: { block: process.argv[8], date: '0' },
      });
      console.log(balances);
    },
    20000,
  );
});
