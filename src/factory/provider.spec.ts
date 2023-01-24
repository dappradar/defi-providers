import { Test, TestingModule } from '@nestjs/testing';
import { FactoryService } from './factory.service';
import { AppModule } from '../app.module';

describe(process.argv[4], () => {
  let factoryService: FactoryService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    factoryService = module.get(FactoryService);
  });
  it(process.argv[5], async () => {
    const { balances } = await factoryService.getTvl({
      provider: process.argv[5],
      chain: process.argv[4],
      query: { block: process.argv[6], date: '0' },
    });
    console.log(balances);
  });
});
