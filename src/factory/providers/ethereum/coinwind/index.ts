import BigNumber from 'bignumber.js';
import POOL_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const POOL_ADDRESSES = ['0x8ddc12f593F1c92122D5dda9244b5e749cBFB2e4'];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 12856222) {
    return {};
  }

  const poolLengths = await util.executeCallOfMultiTargets(
    POOL_ADDRESSES,
    POOL_ABI,
    'poolLength',
    [],
    block,
    chain,
    web3,
  );

  const results = await Promise.all(
    POOL_ADDRESSES.map((address, index) =>
      util.executeMultiCallsOfTarget(
        address,
        POOL_ABI,
        'poolInfo',
        Array.from({ length: poolLengths[index] || 0 }, (v, i) => [i]),
        block,
        chain,
        web3,
      ),
    ),
  );

  const wantBalances = [];
  results.forEach((result) => {
    if (result) {
      result.forEach((res) => {
        if (res) {
          const balance = BigNumber(res.totalAmount || 0);
          if (balance.isGreaterThan(0)) {
            wantBalances.push({
              token: res.token.toLowerCase(),
              balance,
            });
          }
        }
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, wantBalances);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );
  return { balances };
}

export { tvl };
