import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const ETH_BASED_POOL_CONTRACTS = [
  '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc', // 0.1 ETH
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936', // 1 ETH
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf', // 10 ETH
  '0xa160cdab225685da1d56aa342ad8841c3b53f291', // 100 ETH
];
const TOKEN_BASED_POOL_CONTRACTS = [
  '0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3', // 100 DAI
  '0xfd8610d20aa15b7b2e3be39b396a1bc3516c7144', // 1 000 DAI
  '0x07687e702b410Fa43f4cB4Af7FA097918ffD2730', // 10 000 DAI
  '0x23773E65ed146A459791799d01336DB287f25334', // 100 000 DAI
  '0x22aaA7720ddd5388A3c0A3333430953C68f1849b', // 5 000 cDAI
  '0x03893a7c7463AE47D46bc7f091665f1893656003', // 50 000 cDAI
  '0x2717c5e28cf931547B621a5dddb772Ab6A35B701', // 500 000 cDAI
  '0xD21be7248e0197Ee08E0c20D4a96DEBdaC3D20Af', // 5 000 000 cDAI
  '0x4736dCf1b7A3d580672CcE6E7c65cd5cc9cFBa9D', // 100 USDC
  '0xd96f2B1c14Db8458374d9Aca76E26c3D18364307', // 1 000 USDC
  '0x169AD27A470D064DEDE56a2D3ff727986b15D52B', // 100 USDT
  '0x0836222F2B2B24A3F36f98668Ed8F0B38D1a872f', // 1 000 USDT
  '0x178169B423a011fff22B9e3F3abeA13414dDD0F1', // 0.1 WBTC
  '0x610B717796ad172B316836AC95a2ffad065CeaB4', // 1 WBTC
  '0xbB93e510BbCD0B7beb5A853875f9eC60275CF498', // 10 WBTC
];
const TOKENS = [
  '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
  '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', // cDAI
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
];
const START_BLOCK = 9116966;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const ethBalances = await util.getBalancesOfHolders(
    ETH_BASED_POOL_CONTRACTS,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, ethBalances);

  const tokenBalances = await util.getTokenBalancesOfEachHolder(
    TOKEN_BASED_POOL_CONTRACTS,
    TOKENS,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  //console.log(balances);
  return { balances };
}

export { tvl };
