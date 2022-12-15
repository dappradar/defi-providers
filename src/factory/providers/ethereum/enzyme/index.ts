import BigNumber from 'bignumber.js';
import { tvl as v1TVL } from './v1';
import { tvl as v2TVL } from './v2';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 7271059) {
    return {};
  }

  const balances = {};
  const balanceResults = await Promise.all([v1TVL(params), v2TVL(params)]);
  balanceResults.forEach((results) => {
    if (results) {
      formatter.sumMultiBalanceOf(balances, results);
    }
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
