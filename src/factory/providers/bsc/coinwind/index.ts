import BigNumber from 'bignumber.js';
import POOL_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_ADDRESSES = [
  '0x6bA7d75eC6576F88a10bE832C56F0F27DC040dDD',
  '0xAdA5598d0E19B4d3C64585b4135c5860d4A0881F',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < 6479185) {
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
    web3,
  );

  return { balances };
}

export { tvl };
