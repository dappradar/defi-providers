import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';

const POST_TECH = '0x87da6930626fe0c7db8bc15587ec0e410937e5dc';
const START_BLOCK = 126045171;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = {
    [util.ZERO_ADDRESS]: await web3.eth.getBalance(POST_TECH, block),
  };

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
