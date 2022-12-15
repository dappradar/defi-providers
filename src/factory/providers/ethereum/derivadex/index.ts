import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
const POOL_ADDRESS = '0x6fb8aa6fc6f27e591423009194529ae126660027';
const TOKEN_ADDRESSES = [
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // usdt
  '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9', // cusdt
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // usdc
  '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cusdc
  '0xdf574c24545e5ffecb9a659c229253d4111d87e1', // husd
  '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd', // gusd
  '0xc00e94cb662c3520282e6f5717214004a7f26888', // compound
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11383520) {
    return {};
  }

  const balanceResults = await util.getTokenBalances(
    POOL_ADDRESS,
    TOKEN_ADDRESSES,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
