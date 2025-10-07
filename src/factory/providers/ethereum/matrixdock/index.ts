import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import util from '../../../../util/blockchainUtil';

const TOKENS = ['0x2103E845C5E135493Bb6c2A4f0B8651956eA8682'];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  const balances = {};

  try {
    const totalSupplies = await util.getTokenTotalSupplies(
      TOKENS,
      block,
      chain,
      web3,
    );

    totalSupplies.forEach((token) => {
      if (token && token.totalSupply.isGreaterThan(0)) {
        formatter.merge(balances, token.token, token.totalSupply.toFixed());
      }
    });
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching MatrixDock total supplies',
      endpoint: 'tvl',
    });
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
