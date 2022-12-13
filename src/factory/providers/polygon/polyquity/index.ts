import MANAGER_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const MANAGER_ADDRESS = '0xA2A065DBCBAE680DF2E6bfB7E5E41F1f1710e63b';
const WMATIC_ADDRESS = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';
const USDC_TROVE_MANAGER_ADDRESS = '0x09273531f634391dE6be7e63C819F4ccC086F41c';
const USDC_ADDRESS = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 16209502) {
    return {};
  }

  const tokens = [WMATIC_ADDRESS, USDC_ADDRESS];
  const managers = [MANAGER_ADDRESS, USDC_TROVE_MANAGER_ADDRESS];
  const tokenBalances = await util.executeCallOfMultiTargets(
    managers,
    MANAGER_ABI,
    'getEntireSystemColl',
    [],
    block,
    chain,
    web3,
  );

  const balances = {};
  tokenBalances.forEach((balance, index) => {
    if (balance) {
      balances[tokens[index]] = balance;
    }
  });
  return { balances };
}

export { tvl };
