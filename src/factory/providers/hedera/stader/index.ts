import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';

const hederaStaderUrl = 'https://staderverse.staderlabs.com/tvl';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const tvls = await axios.get(hederaStaderUrl);

  const balances = {
    coingecko_hedera: BigNumber(tvls.data.hedera.native).toFixed(),
  };

  return { balances };
}

export { tvl };
