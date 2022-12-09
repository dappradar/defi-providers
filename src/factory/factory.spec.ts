import { Test, TestingModule } from '@nestjs/testing';
import { FactoryService } from './factory.service';
import { AppModule } from '../app.module';

describe('providers', () => {
  let factoryService: FactoryService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    factoryService = module.get(FactoryService);
    await factoryService.onModuleInit();
  });

  describe('ethereum', () => {
    it('yearn block: 16145650', async () => {
      const { balances } = await factoryService.getTvl({
        provider: 'yearn',
        chain: 'ethereum',
        query: { block: '16145650', date: '0' },
      });
      const responseKeys = Object.keys(balances);
      expect(responseKeys).toContain(
        '0x0000000000085d4780b73119b644ae5ecd22b376',
      );
      expect(responseKeys.length).toBeGreaterThan(0);
    });
    it('block: 16145650', async () => {
      const { balances } = await factoryService.getTvl({
        provider: 'wing',
        chain: 'ethereum',
        query: { block: '16145650', date: '0' },
      });
      const responseKeys = Object.keys(balances);
      expect(responseKeys).toContain(
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      );
      expect(responseKeys.length).toBeGreaterThan(0);
    });
  });
});
