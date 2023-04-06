import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import ABI from './abi.json';

const START_BLOCK = 5869479;
const LCRO_ADDRESS = '0x9fae23a2700feecd5b93e43fdbc03c76aa7c08a6';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  balances['cro'] = await util.executeCall(
    LCRO_ADDRESS,
    ABI,
    'getTotalPooledCro',
    [],
    block,
    chain,
    web3,
  );

  return { balances };
}

export { tvl };
