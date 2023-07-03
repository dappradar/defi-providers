import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import formatter from '../../../../util/formatter';
import BigNumber from 'bignumber.js';

const SPICY_API =
  'https://spicya.sdaotools.xyz/api/rest/TokenList?day_agg_start=';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, date, chain, provider, web3 } = params;
  const balances = {};
  if (block < 1765238) {
    return balances;
  }
  const tokenList = await axios.get(
    `${SPICY_API}${Math.floor(new Date(date).getTime() / 1000)}`,
  );
  balances['xtz'] = tokenList.data.tokens
    .reduce((accumulator, token) => {
      return BigNumber(accumulator).plus(token.totalliquidityxtz);
    }, 0)
    .shiftedBy(6);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
