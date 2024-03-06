import util from '../../../../util/blockchainUtil';
import FLUID_LIQUIDITY_RESOLVER_ABI from './fluidLiquidityResolverAbi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const FLUID_LIQUIDITY_RESOLVER_ADDRESS =
  '0x741c2Cd25f053a55fd94afF1afAEf146523E1249';
const FLUID_LIQUIDITY_PROXY_ADDRESS =
  '0x52aa899454998be5b000ad077a46bbe360f4e497';
const START_BLOCK = 19239123;
const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const listedTokens = await util.executeCall(
    FLUID_LIQUIDITY_RESOLVER_ADDRESS,
    FLUID_LIQUIDITY_RESOLVER_ABI,
    'listedTokens',
    [],
    block,
    chain,
    web3,
  );

  const balances = {
    [util.ZERO_ADDRESS]: await web3.eth.getBalance(
      FLUID_LIQUIDITY_PROXY_ADDRESS,
      block,
    ),
  };

  const tokenBalances = await util.getTokenBalances(
    FLUID_LIQUIDITY_PROXY_ADDRESS,
    listedTokens.filter((token: any) => token.token !== ETH_ADDRESS),
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
