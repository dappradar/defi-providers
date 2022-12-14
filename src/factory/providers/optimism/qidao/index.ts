import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 5386422;
const VAULTS = [
  '0x062016cd29fabb26c52bab646878987fc9b0bc55',
  '0xb9c8f0d3254007ee4b98970b94544e473cd610ec',
];
const WBTC = '0x68f180fcCe6836688e9084f035309E29Bf0A2095';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const balanceResults = await util.getTokenBalancesOfHolders(
    VAULTS,
    [basicUtil.getWmainAddress(chain), WBTC],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
