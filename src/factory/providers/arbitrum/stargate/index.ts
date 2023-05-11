import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import FACTORY_ABI from './abi/factoryAbi.json';
import POOL_ABI from './abi/poolAbi.json';
import { WMAIN_ADDRESS } from '../../../../constants/contracts.json';

const START_BLOCK = 11700000;
const FACTORY = '0x55bdb4164d28fbaf0898e0ef14a589ac09ac9970';
const SGETH = '0x82cbecf39bee528b5476fe6d1550af59a9db6fc0';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const allPoolsLength = await util.executeCall(
    FACTORY,
    FACTORY_ABI,
    'allPoolsLength',
    [],
    block,
    chain,
    web3,
  );

  const contractParams = [];
  for (let i = 0; i < allPoolsLength; i++) {
    contractParams.push([i]);
  }

  const pools = await util.executeMultiCallsOfTarget(
    FACTORY,
    FACTORY_ABI,
    'allPools',
    contractParams,
    block,
    chain,
    web3,
  );

  const tokens = await util.executeCallOfMultiTargets(
    pools,
    POOL_ABI,
    'token',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = await util.getTokenBalancesOfHolders(
    pools,
    tokens,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);

  if (balances[SGETH]) {
    balances[WMAIN_ADDRESS.arbitrum] = balances[SGETH];
    delete balances[SGETH];
  }
  return { balances };
}
export { tvl };
