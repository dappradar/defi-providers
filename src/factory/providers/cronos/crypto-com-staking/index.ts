import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 11456757;
const TOKEN = '0x7a7c9db510ab29a2fc362a4c34260becb5ce3446';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = {};

  const totalSupply = await util.getTotalSupply(TOKEN, block, web3);

  balances[TOKEN] = totalSupply.totalSupply.toFixed();

  return { balances };
}

export { tvl };
