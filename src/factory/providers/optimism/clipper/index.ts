import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import axios from 'axios';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const clipperRfqUrlForOptimism =
  'https://api.clipper.exchange/rfq/pool?chain_id=10';
const startBlock = 3183055;

async function getChainData() {
  const {
    data: {
      pool: { address: poolAddress },
      assets,
    },
  } = await axios.get(clipperRfqUrlForOptimism);
  return {
    poolAddress,
    tokens: assets.map(({ address }) => address),
  };
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < startBlock) {
    return {};
  }

  const balances = {};
  const { poolAddress, tokens } = await getChainData();
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
