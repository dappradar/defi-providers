import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const DEGENESIS_ADDRESS = '0xc803737D3E12CC4034Dde0B2457684322100Ac38';
const WETHPOOL_ADDRESS = '0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36';
const USDCPOOL_ADDRESS = '0x04bda0cf6ad025948af830e75228ed420b0e860d';
const RTOKE_ADDRESS = '0xa760e26aA76747020171fCF8BdA108dFdE8Eb930';
const SLPSTAKING_ADDRESS = '0x8858a739ea1dd3d80fe577ef4e0d03e88561faa3';
const UNISTAKING_ADDRESS = '0x1b429e75369ea5cd84421c1cc182cee5f3192fd3';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const TOKE_ADDRESS = '0x2e9d63788249371f1dfc918a52f8d799f4a38c94';
const SLP_ADDRESS = '0xd4e7a6e2d03e4e48dfc27dd3f46df1c176647e38';
const UNI_ADDRESS = '0x5fa464cefe8901d66c09b85d5fcdc55b3738c688';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 12912472) {
    return {};
  }

  const results = await util.getTokenBalancesOfHolders(
    [
      DEGENESIS_ADDRESS,
      DEGENESIS_ADDRESS,
      WETHPOOL_ADDRESS,
      USDCPOOL_ADDRESS,
      RTOKE_ADDRESS,
      SLPSTAKING_ADDRESS,
      UNISTAKING_ADDRESS,
    ],
    [
      WETH_ADDRESS,
      USDC_ADDRESS,
      WETH_ADDRESS,
      USDC_ADDRESS,
      TOKE_ADDRESS,
      SLP_ADDRESS,
      UNI_ADDRESS,
    ],
    block,
    chain,
    web3,
  );

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, results);
  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );
  return { balances };
}

export { tvl };
