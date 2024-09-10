import util from '../../../../util/blockchainUtil';
import FLUID_LIQUIDITY_RESOLVER_ABI from './../../../../constants/abi/fluidLiquidityResolverAbi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const FLUID_LIQUIDITY_RESOLVER_ADDRESS =
  '0x741c2Cd25f053a55fd94afF1afAEf146523E1249';
const FLUID_LIQUIDITY_RESOLVER_ADDRESS_2 =
  '0xD7588F6c99605Ab274C211a0AFeC60947668A8Cb';
const FLUID_LIQUIDITY_PROXY_ADDRESS =
  '0x52aa899454998be5b000ad077a46bbe360f4e497';
const START_BLOCK = 19239123;
const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const WEETH_ADDRESS = '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee';
const ZIRCUIT_ADDRESS = '0xF047ab4c75cebf0eB9ed34Ae2c186f3611aEAfa6';
const WEETHS_ADDRESS = '0x917ceE801a67f933F2e6b33fC0cD1ED2d5909D88';
const ZIRCUIT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'balance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const liquidityResolverAddress =
    block < 19992056
      ? FLUID_LIQUIDITY_RESOLVER_ADDRESS
      : FLUID_LIQUIDITY_RESOLVER_ADDRESS_2;

  const listedTokens = await util.executeCall(
    liquidityResolverAddress,
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

  balances[WEETHS_ADDRESS] = await util.executeCall(
    ZIRCUIT_ADDRESS,
    ZIRCUIT_ABI,
    'balance',
    [WEETHS_ADDRESS, FLUID_LIQUIDITY_PROXY_ADDRESS],
    block,
    chain,
    web3,
  );

  balances[WEETH_ADDRESS] = await util.executeCall(
    ZIRCUIT_ADDRESS,
    ZIRCUIT_ABI,
    'balance',
    [WEETH_ADDRESS, FLUID_LIQUIDITY_PROXY_ADDRESS],
    block,
    chain,
    web3,
  );

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
