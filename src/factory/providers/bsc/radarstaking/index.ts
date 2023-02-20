import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 19148158;
const STAKING_REWARDS_PROXY = '0xabdac90a270ef9b6661e3edee922fa051e27593e';
const STAKING_REWARDS_PROXY_V2 = '0x0C3d5dbc5f785a485a76c8411e5d6D41E0a33850';
const RADAR_TOKEN = '0x489580eb70a50515296ef31e8179ff3e77e24965';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const proxyBalance = await util.getTokenBalancesOfEachHolder(
    [STAKING_REWARDS_PROXY, STAKING_REWARDS_PROXY_V2],
    [RADAR_TOKEN],
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, proxyBalance, chain, provider);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
