import POOL_ABI from './abi.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

const POOL_ADDRESS = '0x6F400810b62df8E13fded51bE75fF5393eaa841F';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 9340147) {
    return {};
  }

  let tokens = [];
  try {
    tokens = await basicUtil.readFromCache('pools.json', chain, provider);
  } catch {}

  const contract = new web3.eth.Contract(POOL_ABI, POOL_ADDRESS);
  let len = 0;
  try {
    len = await contract.methods.numTokens().call(null, block);
    len = Number(len);
  } catch (e) {
    return;
  }

  const tokenLength = tokens.length;
  for (let start = tokenLength; start < len; start += 3000) {
    const end = Math.min(start + 3000, len);
    try {
      const tokenResults = await util.executeMultiCallsOfTarget(
        POOL_ADDRESS,
        POOL_ABI,
        'tokenIdToAddressMap',
        Array.from({ length: end - start }, (v, i) => [start + i]),
        block,
        chain,
        web3,
      );
      tokenResults
        .filter((token) => token)
        .forEach((token) => tokens.push(token.toLowerCase()));
    } catch (e) {
      break;
    }
  }
  basicUtil.savedIntoCache(tokens, 'pools.json', chain, provider);

  const balanceResults = await util.getTokenBalances(
    POOL_ADDRESS,
    tokens,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
