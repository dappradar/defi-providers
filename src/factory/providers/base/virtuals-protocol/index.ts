import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 30172056;
const STAKING_CONTRACT = '0x60a203ddcDE45fbfb325bdeEA93824B5726b4dF8';
const VIRTUALS_TOKEN = '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const proxyBalance = await util.getTokenBalancesOfEachHolder(
    [STAKING_CONTRACT],
    [VIRTUALS_TOKEN],
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
