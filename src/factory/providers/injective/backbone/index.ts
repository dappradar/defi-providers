import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

const HUB_ADDRESS = 'inj1dxp690rd86xltejgfq2fa7f2nxtgmm5cer3hvu';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  try {
    const result = await web3.eth.call(HUB_ADDRESS, 'state');
    const totalNative = result?.total_native;

    if (totalNative) {
      balances['inj'] = BigNumber(totalNative).toFixed();
    }

    formatter.convertBalancesToFixed(balances);
    return { balances };
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of injective/backbone`,
      endpoint: 'tvl',
    });
    return { balances };
  }
}

export { tvl };
