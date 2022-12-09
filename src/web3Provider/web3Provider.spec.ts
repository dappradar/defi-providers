import { Web3ProviderService } from './web3Provider.service';
import { Near } from './near';
import { Tezos } from './tezos';
import { Test, TestingModule } from '@nestjs/testing';
import { Web3ProviderModule } from './web3Provider.module';

describe('web3', () => {
  let web3ProviderService: Web3ProviderService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [Web3ProviderModule],
    }).compile();
    web3ProviderService = module.get<Web3ProviderService>(Web3ProviderService);
  });

  describe('everscale providers', () => {
    it('web3', async () => {
      const everscale = await web3ProviderService.getWeb3('everscale');
      expect(typeof (await everscale.eth.getBlockNumber())).toBe(typeof 123);
    });
  });

  describe('near providers', () => {
    it('web3', async () => {
      const near = new Near();
      await near.onModuleInit();
      // const near: { eth: Near } = await web3ProviderService.getWeb3('near');
      expect(typeof (await near.getBlockNumber())).toBe(typeof 123);
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
      await web3ProviderService.getWeb3('stacks');
      expect(typeof (await stacks.eth.getBlockNumber())).toBe(typeof 123);
    });
  });
  describe('tezos providers', () => {
    it('web3', async () => {
      const tezos = new Tezos();
      await tezos.onModuleInit();
      expect(typeof (await tezos.getBlockNumber())).toBe(typeof 123);
    });
  });
});
