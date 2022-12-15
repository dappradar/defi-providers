import BigNumber from 'bignumber.js';
import POOL_ABI from './abi.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOLS = [
  {
    address: '0x136D841d4beCe3Fc0E4dEbb94356D8b6B4b93209',
    token: '0x6b175474e89094c44da98b954eedeac495271d0f',
  },
  {
    address: '0x136D841d4beCe3Fc0E4dEbb94356D8b6B4b93209',
    token: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    base: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  {
    address: '0x136D841d4beCe3Fc0E4dEbb94356D8b6B4b93209',
    token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  },
  {
    address: '0x136D841d4beCe3Fc0E4dEbb94356D8b6B4b93209',
    token: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  },
  {
    address: '0x136D841d4beCe3Fc0E4dEbb94356D8b6B4b93209',
    token: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  {
    address: '0x136D841d4beCe3Fc0E4dEbb94356D8b6B4b93209',
    token: '0x544c42fbb96b39b21df61cf322b5edc285ee7429',
  },
  {
    address: '0x136D841d4beCe3Fc0E4dEbb94356D8b6B4b93209',
    token: '0x169bf778a5eadab0209c0524ea5ce8e7a616e33b',
  },
  {
    address: '0x136D841d4beCe3Fc0E4dEbb94356D8b6B4b93209',
    token: '0xe2f2a5c287993345a840db3b0845fbc70f5935a5',
  },
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 12301500) {
    return {};
  }

  const results = await util.executeMultiCallsOfMultiTargets(
    POOLS.map((pool) => pool.address),
    POOL_ABI,
    'getStakedAmountPT',
    POOLS.map((pool) => [pool.token]),
    block,
    chain,
    web3,
  );

  const balanceResults = results.map((result, index) => ({
    token: POOLS[index].base || POOLS[index].token,
    balance: new BigNumber(result || 0),
  }));

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );
  return { balances };
}

export { tvl };
