import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';

const POST_TECH = '0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4';
const START_BLOCK = 2430440;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, web3 } = params;
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
