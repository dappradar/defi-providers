import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const BRIDGE_ADDRESS = '0xaeD5b25BE1c3163c907a471082640450F928DDFE';
const tokens = ['0x98878B06940aE243284CA214f92Bb71a2b032B8A'];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 890949) {
    return {};
  }

  const balances = {};
  const results = await util.getTokenBalances(
    BRIDGE_ADDRESS,
    tokens,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, results);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
