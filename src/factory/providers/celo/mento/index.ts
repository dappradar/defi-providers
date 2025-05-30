import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const OWNERS = [
  '0x9380fA34Fd9e4Fd14c06305fd7B6199089eD4eb9',
  '0x246f4599eFD3fA67AC44335Ed5e749E518Ffd8bB',
  '0x298FbD6dad2Fc2cB56d7E37d8aCad8Bf07324f67',
  '0x87647780180b8f55980c7d3ffefe08a9b29e9ae1',
];
const TOKENS = [
  '0x004626A008B1aCdC4c74ab51644093b155e59A23',
  '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
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
