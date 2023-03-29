import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 12801290;
const VAULTS = [
  '0x7Af4e1cE484f40D927b9C90fB6905Df4376fc3F6',
  '0xd7d974E81382D05E8D9fc6d0d17d0d852e9806dd',
  '0x2935CD347B79C319A6464fe3b1087170f142418C',
  '0x69B4B35504a8c1d6179fef7AdDCDB37A8c663BC9',
  '0x788843DE0Be1598155bFFaAB7Cfa2eCBd542E7f1',
  '0xE722F9aee66F649FBfc8CB0d4F906cb55803553c',
  '0x585a72ccecde68dDFE5327B23134723a305D70F3',
  '0x0A68E15f8E289b9f1Ad1BCAD524FeA30C6125c2D',
  '0xA33C1963d74d203DF6bFfDfDa3bFf39a1D76e1D0',
  '0xa5ce396616c7D14F61B5B9bbA3A57388Db885b2E',
  '0xdE48b1B5853cc63B1D05e507414D3E02831722F8',
  '0x5Db73886c4730dBF3C562ebf8044E19E8C93843e',
  '0x3E86B53e1D7DA7eDbA225c3A218d0b5a7544fDfD',
  '0x3C73CD65D708A5C951f0Cc19a4D0Bb6559ae20c5',
  '0x26Cf967E466d9Fd60AF7d1B78a01c43E75e03b32',
];
const TOKENS = [
  '0xc5db22719a06418028a40a9b5e9a7c02959d0d08',
  '0x298B9B95708152ff6968aafd889c6586e9169f1D',
  '0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9',
  '0xE405de8F52ba7559f9df3C368500B6E6ae6Cee49',
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
