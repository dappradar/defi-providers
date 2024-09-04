import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';

const CONTRACT1 = '0x31b8a8ee92961524fd7839dc438fd631d34b49c6';
const CONTRACT2 = '0x00199E444155f6a06d74CF36315419d39b874f5c';
const TOKENS = [
  '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  '0x55d398326f99059fF775485246999027B3197955',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 30325393) {
    return {};
  }

  const tokenBalances1 = await util.getTokenBalances(
    CONTRACT1,
    TOKENS,
    block,
    chain,
    web3,
  );

  const bnbBalance1 = await web3.eth.getBalance(CONTRACT1, block);

  const tokenBalances2 = await util.getTokenBalances(
    CONTRACT2,
    TOKENS,
    block,
    chain,
    web3,
  );

  const bnbBalance2 = await web3.eth.getBalance(CONTRACT2, block);

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances1, chain, provider);
  formatter.sumMultiBalanceOf(balances, tokenBalances2, chain, provider);
  balances['bnb'] = new BigNumber(bnbBalance1).plus(bnbBalance2).toString();

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
