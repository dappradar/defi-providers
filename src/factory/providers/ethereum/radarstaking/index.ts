import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 15051901;
const STAKING_REWARDS_PROXY = '0x990d156d511d0493a0b7c32d1af97e0c9e352acd';
const RADAR_TOKEN = '0x44709a920fccf795fbc57baa433cc3dd53c44dbe';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const proxyBalance = await util.getTokenBalances(
    STAKING_REWARDS_PROXY,
    [RADAR_TOKEN],
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, proxyBalance);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
