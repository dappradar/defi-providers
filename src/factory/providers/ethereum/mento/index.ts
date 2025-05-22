import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const OWNERS = [
  '0xe1955eA2D14e60414eBF5D649699356D8baE98eE',
  '0x8331C987D9Af7b649055fa9ea7731d2edbD58E6B',
  '0x26ac3A7b8a675b741560098fff54F94909bE5E73',
  '0x16B34Ce9A6a6F7FC2DD25Ba59bf7308E7B38E186',
  '0xd0697f70E79476195B742d5aFAb14BE50f98CC1E',
];
const TOKENS = [
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  '0x6b175474e89094c44da98b954eedeac495271d0f',
  '0x83f20f44975d03b1b09e64809b757c47f942beea',
  '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 2947) {
    return {};
  }

  const balances = {};

  let tokenBalances = await util.getBalancesOfHolders(
    OWNERS,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);

  tokenBalances = await util.getTokenBalancesOfEachHolder(
    OWNERS,
    TOKENS,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
