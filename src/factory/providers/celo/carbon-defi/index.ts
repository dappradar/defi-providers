import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 26828280;
const CONTROLLER = '0x6619871118D144c1c28eC3b23036FC1f0829ed3a';
const EEEEE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};

  const tokens = (await util.executeCall(
    CONTROLLER,
    abi,
    'pairs',
    [],
    block,
    chain,
    web3,
  )) as string[];

  const uniqueTokens = [
    ...new Set(
      tokens
        .map((pair) => pair.split(',')[0])
        .filter((token) => token.toLowerCase() !== EEEEE_ADDRESS.toLowerCase()),
    ),
  ];

  let tokenBalances = await util.getTokenBalances(
    CONTROLLER,
    uniqueTokens,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);

  tokenBalances = await util.getBalancesOfHolders(
    [CONTROLLER],
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
