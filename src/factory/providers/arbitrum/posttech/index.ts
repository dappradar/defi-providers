import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const POST_TECH = '0x87da6930626fe0c7db8bc15587ec0e410937e5dc';
const START_BLOCK = 126045171;
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = {
    [WETH_ADDRESS]: await web3.eth.getBalance(POST_TECH, block),
  };

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
