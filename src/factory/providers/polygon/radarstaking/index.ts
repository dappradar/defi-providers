import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 50613367;
const STAKING_CONTRACT = '0x23097285FAb23CB6BA67CC550fcEe4ED6F685eA4';
const RADAR_TOKEN = '0xdCb72AE4d5dc6Ae274461d57E65dB8D50d0a33AD';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const tokenBalances = await util.getTokenBalances(
    STAKING_CONTRACT,
    [RADAR_TOKEN],
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
