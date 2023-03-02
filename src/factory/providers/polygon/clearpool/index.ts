import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import formatter from '../../../../util/formatter';

const CLEARPOOLURL = 'https://app.clearpool.finance/api/pools';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const {
    data: { 137: poolAndToken },
  } = await axios.get(CLEARPOOLURL, {
    headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
  });
  const pools = [];
  const token = [];
  poolAndToken.forEach((data) => {
    pools.push(data.address);
    token.push(data.currencyAddress);
  });

  const tokenBalances = await util.getTokenBalancesOfHolders(
    pools,
    token,
    block,
    chain,
    web3,
  );
  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
