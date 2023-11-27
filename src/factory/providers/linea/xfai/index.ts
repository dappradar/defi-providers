import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import FACTORY_ABI from '../../arbitrum/stargate/abi/factoryAbi.json';

const START_BLOCK = 222864;
const FACTORY_ADDRESS = '0xa5136eAd459F0E61C99Cec70fe8F5C24cF3ecA26';
const WETH = '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f';
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const allPoolsLength = await util.executeCall(
    FACTORY_ADDRESS,
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
    FACTORY_ADDRESS,
    FACTORY_ABI,
    'allPools',
    contractParams,
    block,
    chain,
    web3,
  );

  const tokens = await util.executeCallOfMultiTargets(
    pools,
    [
      {
        inputs: [],
        name: 'poolToken',
        outputs: [
          {
            type: 'address',
            name: 'token',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    'poolToken',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = await util.getTokenBalancesOfEachHolder(
    pools,
    [WETH, ...tokens],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
