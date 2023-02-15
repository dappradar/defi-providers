import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import POOL_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_ADDRESSES = '0x5162f992EDF7101637446ecCcD5943A9dcC63A8A';
let tokens = {};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 5987378) {
    return {};
  }

  try {
    tokens = basicUtil.readDataFromFile('cache/tokens.json', chain, provider);
  } catch {}

  const contract = new web3.eth.Contract(POOL_ABI, POOL_ADDRESSES);
  try {
    for (let i = 0; ; i += 1) {
      try {
        if (!tokens[i]) {
          const token = await contract.methods.getToken(i).call(null, block);
          tokens[i] = token.toLowerCase();
        }
      } catch {
        break;
      }
    }
  } catch {}

  basicUtil.writeDataToFile(tokens, 'cache/tokens.json', chain, provider);

  const tokenIDs = Object.keys(tokens);

  const results = await util.executeMultiCallsOfTarget(
    POOL_ADDRESSES,
    POOL_ABI,
    'getTokenBalance',
    tokenIDs.map((id) => [id]),
    block,
    chain,
    web3,
  );

  const balanceResults = [];

  results.forEach((result, index) => {
    const balance = BigNumber(result || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: tokens[tokenIDs[index]],
        balance,
      });
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
