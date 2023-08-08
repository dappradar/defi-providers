import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import axios from 'axios';
import basicUtil from '../../../../util/basicUtil';
import { log } from '../../../../util/logger/logger';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const clipperRfqUrlForOptimism =
  'https://api.clipper.exchange/rfq/pool?chain_id=10';
const startBlock = 3183055;

async function getChainData(chain, provider) {
  let poolInfo: { poolAddress: string; tokens: string[] };

  try {
    const {
      data: {
        pool: { address: poolAddress },
        assets,
      },
    } = await axios.get(clipperRfqUrlForOptimism);

    poolInfo = {
      poolAddress,
      tokens: assets.map(({ address }) => address),
    };

    await basicUtil.saveIntoCache(poolInfo, 'poolInfo.json', chain, provider);
  } catch (e) {
    log.error({
      message: `Issue with Clipper API`,
      stack: e.stack,
      detail: `Error: getChainData of optimism/clipper`,
      endpoint: 'getChainData',
    });
    poolInfo = await basicUtil.readFromCache('poolInfo.json', chain, provider);
  }

  return poolInfo;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < startBlock) {
    return {};
  }

  const balances = {};
  const { poolAddress, tokens } = await getChainData(chain, provider);
  const tokenBalances = await util.getTokenBalances(
    poolAddress,
    tokens,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
