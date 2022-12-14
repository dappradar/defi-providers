import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 12801290;
const VAULTS = [
  '0xdE48b1B5853cc63B1D05e507414D3E02831722F8', // Staked Lyra
  '0x5Db73886c4730dBF3C562ebf8044E19E8C93843e', // ETH liquidity pool
  '0x3E86B53e1D7DA7eDbA225c3A218d0b5a7544fDfD', // ETH short collateral
  '0x3C73CD65D708A5C951f0Cc19a4D0Bb6559ae20c5', // BTC liquidity pool
  '0x26Cf967E466d9Fd60AF7d1B78a01c43E75e03b32', // BTC short collateral
];
const TOKENS = [
  '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // Lyra
  '0x298B9B95708152ff6968aafd889c6586e9169f1D', // sBTC
  '0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9', // sUSD
  '0xE405de8F52ba7559f9df3C368500B6E6ae6Cee49', // sETH
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};
  const balanceResults = await util.getTokenBalancesOfEachHolder(
    VAULTS,
    TOKENS,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
