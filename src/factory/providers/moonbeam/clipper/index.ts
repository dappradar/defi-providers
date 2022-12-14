import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';

async function getChainData() {
  const {
    data: {
      pool: { address: poolAddress },
      assets,
    },
  } = await axios.get(`https://api.clipper.exchange/rfq/pool?chain_id=1284`);
  return {
    poolAddress,
    tokens: assets.map(({ address }) => address),
  };
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 576698) {
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
