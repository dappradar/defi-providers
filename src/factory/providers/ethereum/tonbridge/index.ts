import ERC20_ABI from '../../../../constants/abi/erc20.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const TOKEN_ADDRESSES = [
  '0xdac17f958d2ee523a2206206994597c13d831ec7',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  '0x6b175474e89094c44da98b954eedeac495271d0f',
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
];
const POOL_ADDRESSES = [
  '0x41670d468D078771F31b3C1c54Dd8d4E2226e669',
  '0x9C74E75dD1E94915b30F0f20701AF9945592dbf5',
  '0x60Bfb1689E0A43E37f1C1140cE60F59c1d5e8401',
  '0xC3F5146A7F03AC79C56e50980890Ad70BF4EC46c',
  '0x7aF9e00d74c117bC2A0063bB54c067808E615f86',
];
const WTON_ADDRESS = '0xdb3c2515da400e11bcaf84f3b5286f18fff1868f';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11868728) {
    return {};
  }

  const balances = {};

  const [wtonBalance, balanceResults] = await Promise.all([
    util.executeCall(
      WTON_ADDRESS,
      ERC20_ABI,
      'totalSupply',
      [],
      block,
      chain,
      web3,
    ),
    util.getTokenBalancesOfHolders(
      POOL_ADDRESSES,
      TOKEN_ADDRESSES,
      block,
      chain,
      web3,
    ),
  ]);

  if (wtonBalance) {
    balances[WTON_ADDRESS] = wtonBalance;
  }
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
