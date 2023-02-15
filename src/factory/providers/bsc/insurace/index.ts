import BigNumber from 'bignumber.js';
import POOL_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOLS = [
  {
    address: '0xd50E8Ce9D5c1f5228BCC77E318907bB4960578eF',
    token: '0x3192ccddf1cdce4ff055ebc80f3f0231b86a7e30',
  },
  {
    address: '0xd50E8Ce9D5c1f5228BCC77E318907bB4960578eF',
    token: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    base: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  },
  {
    address: '0xd50E8Ce9D5c1f5228BCC77E318907bB4960578eF',
    token: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  },
  {
    address: '0xd50E8Ce9D5c1f5228BCC77E318907bB4960578eF',
    token: '0x55d398326f99059ff775485246999027b3197955',
  },
  {
    address: '0xd50E8Ce9D5c1f5228BCC77E318907bB4960578eF',
    token: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
  },
  {
    address: '0xd50E8Ce9D5c1f5228BCC77E318907bB4960578eF',
    token: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
  },
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 8312474) {
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

  const balanceResults = [];

  POOLS.forEach((pool, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: pool.base || pool.token,
        balance,
      });
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
