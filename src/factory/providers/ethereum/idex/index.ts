import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import TOKENS from './tokens.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CUSTODY_ADDRESS = '0xE5c405C5578d84c5231D3a9a29Ef4374423fA0c2';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11069095) {
    return {};
  }

  const tokenBalances = {};

  try {
    tokenBalances[WETH_ADDRESS] = await web3.eth.getBalance(
      CUSTODY_ADDRESS,
      block,
    );
  } catch {}

  const balanceResults = await util.getTokenBalances(
    CUSTODY_ADDRESS,
    Object.keys(TOKENS),
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );
  return { balances };
}

export { tvl };
