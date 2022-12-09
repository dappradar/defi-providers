import { Web3ProviderService } from './web3Provider.service';
import { Near } from './near';
import { Tezos } from './tezos';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';

describe('web3', () => {
  let web3ProviderService: Web3ProviderService;
  let near: Near;
  let tezos: Tezos;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    web3ProviderService = module.get(Web3ProviderService);
    near = module.get(Near);
    tezos = module.get(Tezos);
    await tezos.onModuleInit();
    await near.onModuleInit();
  });

  describe('everscale providers', () => {
    it('web3', async () => {
      const everscale = await web3ProviderService.getWeb3('everscale');
      expect(typeof (await everscale.eth.getBlockNumber())).toBe(typeof 123);
    });
  });

  describe('near providers', () => {
    it('web3', async () => {
      // const near = new Near();
      // await near.onModuleInit();
      const near = await web3ProviderService.getWeb3('near');
      expect(typeof (await near.eth.getBlockNumber())).toBe(typeof 123);
    });
  });

  describe('hedera providers', () => {
    it('web3', async () => {
      const hedera = await web3ProviderService.getWeb3('hedera');
      await web3ProviderService.getWeb3('hedera');
      const blockNumber = await hedera.eth.getBlock('latest');
      expect(typeof blockNumber.number).toBe(typeof 123);
    });
  });
  describe('solana providers', () => {
    it('web3', async () => {
      const solana = await web3ProviderService.getWeb3('solana');
      expect(typeof (await solana.eth.getBlockNumber())).toBe(typeof 123);
    });
  });
  describe('stacks providers', () => {
    it('web3', async () => {
      const stacks = await web3ProviderService.getWeb3('stacks');
      expect(typeof (await stacks.eth.getBlockNumber())).toBe(typeof 123);
    });
  });
  describe('tezos providers', () => {
    it('web3', async () => {
      const tezos = await web3ProviderService.getWeb3('tezos');
      expect(typeof (await tezos.eth.getBlockNumber())).toBe(typeof 123);
    });
  });
});
