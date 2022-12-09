import VAULTS from './currentVaults.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const FETH_ADDRESS = '0xD93F4cf882D7d576a8Dc09e606B38CaF18Eda796';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < 12184700) {
    return {};
  }

  const balances = {};

  try {
    balances[WETH_ADDRESS] = await web3.eth.getBalance(FETH_ADDRESS, block);
  } catch {}

  const balanceResults = await util.getTokenBalancesOfHolders(
    Object.keys(VAULTS),
    Object.keys(VAULTS).map((vault) => VAULTS[vault]),
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

/*==================================================
  Exports
  ==================================================*/

module.exports = {
  tvl,
};
