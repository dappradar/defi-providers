import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import unitroller from '../../../../util/calculators/unitroller';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 561367;
const ERALEND_CONTRACT = '0x0171cA5b372eb510245F5FA214F5582911934b3D';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  let balances = await unitroller.getTvl(
    [ERALEND_CONTRACT],
    block,
    chain,
    provider,
    web3,
  );


  const tokenBalances = {};
  Object.keys(balances).forEach(function (key) {
    tokenBalances[key] = BigNumber(balances[key]);
  });

  balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
