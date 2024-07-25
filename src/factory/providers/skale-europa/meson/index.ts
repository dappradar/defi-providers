import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';

const URI = 'https://relayer.meson.fi/api/v1/list';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};
  const skaleEuropaData = (await axios.get(URI)).data.result.find(
    (item: any) => item.id === 'skale-europa',
  );

  const tokenBalances = await util.getTokenBalances(
    skaleEuropaData.address,
    skaleEuropaData.tokens.map((token: any) => token.addr),
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
