import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import FLUID_LIQUIDITY_RESOLVER_ABI from './../../../../constants/abi/fluidLiquidityResolverAbi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const FLUID_LIQUIDITY_RESOLVER_ADDRESS =
  '0x98d900e25AAf345A4B23f454751EC5083443Fa83';
const FLUID_LIQUIDITY_PROXY_ADDRESS =
  '0x52aa899454998be5b000ad077a46bbe360f4e497';
const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

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

  if (balances['0x03b54a6e9a984069379fae1a4fc4dbae93b3bccd']) {
    balances[util.ZERO_ADDRESS] = BigNumber(balances[util.ZERO_ADDRESS] || 0)
      .plus(balances['0x03b54a6e9a984069379fae1a4fc4dbae93b3bccd'])
      .toFixed();
    delete balances['0x03b54a6e9a984069379fae1a4fc4dbae93b3bccd'];
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
