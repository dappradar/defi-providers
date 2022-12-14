import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 424144;
const FACTORY_ADDRESS = '0x049581aEB6Fe262727f290165C29BDAB065a1B68';
const stableSwapPools = {
  '3pool': {
    name: '3pool',
    address: '0x9785478135BaFe3dCafe4BBa4C8311674D4E826E',
    assets: ['USDC', 'BUSD', 'USDT'],
    lpToken: '3pool',
  },
  'frax-3pool': {
    name: 'FRAX',
    address: '0x4BB7177319BD1746c3082DDd41c7663E2dbF0f31',
    assets: ['FRAX', '3pool'],
    lpToken: 'frax-3pool',
    basePool: '3pool',
  },
  stksm: {
    name: 'stKSM',
    address: '0x77D4b212770A7cA26ee70b1E0f27fC36da191c53',
    assets: ['xcKSM', 'stKSM'],
    lpToken: 'stksm',
  },
  'kbtc-btc': {
    name: ' BTC-kBTC',
    address: '0xC5d0c8e241b59F989e37B5C35925C58F8c7F66A8',
    assets: ['xcKBTC', 'WBTC'],
    lpToken: 'kbtc-btc',
  },
  'mim-3pool': {
    name: 'MIM',
    address: '0x2a9Fe2514Ed1DaC1C1f5a6d7710C9F6599A27e98',
    assets: ['MIM', '3pool'],
    lpToken: 'mim-3pool',
    basePool: '3pool',
  },
  'mai-3pool': {
    name: 'MAI',
    address: '0x358B4060849E9069482983DEc5E0db671c3337Ff',
    assets: ['MAI', '3pool'],
    lpToken: 'mai-3pool',
    basePool: '3pool',
  },
};

const stableSwapTokens = {
  USDC: {
    address: '0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D',
    decimals: 6,
    symbol: 'USDC',
    gecko: 'usd-coin',
  },
  USDT: {
    address: '0xB44a9B6905aF7c801311e8F4E76932ee959c663C',
    decimals: 6,
    symbol: 'USDT',
    gecko: 'tether',
  },
  BUSD: {
    address: '0x5D9ab5522c64E1F6ef5e3627ECCc093f56167818',
    decimals: 18,
    symbol: 'BUSD',
    gecko: 'binance-usd',
  },
  FRAX: {
    symbol: 'FRAX',
    name: 'FRAX',
    address: '0x1A93B23281CC1CDE4C4741353F3064709A16197d',
    decimals: 18,
    gecko: 'frax',
  },
  MIM: {
    symbol: 'MIM',
    name: 'Magic Internet Money',
    address: '0x0caE51e1032e8461f4806e26332c030E34De3aDb',
    decimals: 18,
    gecko: 'magic-internet-money',
  },
  MAI: {
    symbol: 'MAI',
    name: 'Mai Stablecoin',
    address: '0xFb2019DfD635a03cfFF624D210AEe6AF2B00fC2C',
    decimals: 18,
    gecko: 'mimatic',
  },
  xcKSM: {
    symbol: 'xcKSM',
    name: 'xcKSM',
    address: '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080',
    decimals: 12,
    gecko: 'kusama',
  },
  stKSM: {
    symbol: 'stKSM',
    name: 'stKSM',
    address: '0xFfc7780C34B450d917d557E728f033033CB4fA8C',
    decimals: 12,
    gecko: 'kusama',
  },
  xcKBTC: {
    symbol: 'xcKBTC',
    name: 'Kintsugi Wrapped BTC',
    address: '0xFFFfFfFfF6E528AD57184579beeE00c5d5e646F0',
    decimals: 8,
    gecko: 'bitcoin',
  },
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    address: '0x6aB6d61428fde76768D7b45D8BFeec19c6eF91A8',
    decimals: 8,
    gecko: 'bitcoin',
  },
};

async function getStableDexTVL(block, chain, web3) {
  const holders = [];
  const tokens = [];

  for (const pool of Object.values(stableSwapPools)) {
    for (const token of pool.assets) {
      if (stableSwapTokens[token]) {
        holders.push(pool.address);
        tokens.push(stableSwapTokens[token].address);
      }
    }
  }

  return await util.getTokenBalancesOfHolders(
    holders,
    tokens,
    block,
    chain,
    web3,
  );
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  formatter.sumMultiBalanceOf(
    balances,
    await getStableDexTVL(block, chain, web3),
  );

  for (const token in balances) {
    if (BigNumber(balances[token]).isLessThan(100000)) {
      delete balances[token];
    }
  }

  formatter.convertBalancesToFixed(balances);
  //console.log(balances);
  return { balances, poolBalances };
}

export { tvl };
