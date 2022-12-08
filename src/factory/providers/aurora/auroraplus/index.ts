import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import {
  ITvlParams,
  ITvlBalancesReturn,
  ITvlBalancesPoolBalancesReturn,
} from '../../../../interfaces/ITvl';

const START_BLOCK = 65575540;
const AURORA = '0x8bec47865ade3b172a928df8f990bc7f2a3b9f79';
const STAKING_CONTRACT = '0xf075c896cbbb625e7911e284cd23ee19bdccf299';

async function tvl(
  params: ITvlParams,
): Promise<
  ITvlBalancesReturn | ITvlBalancesPoolBalancesReturn | Record<string, never>
> {
  const { block, chain } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};
  const balanceResults = await util.getTokenBalances(
    STAKING_CONTRACT,
    [AURORA],
    block,
    chain,
  );
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
