import BigNumber from 'bignumber.js';
import ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

const START_BLOCK = 2162390;
const COMPTROLLER_ADDRESS = '0xfbb21d0380bee3312b33c4353c8936a0f13ef26c';
let mtokens = {};

async function getMarkets(block, chain, web3) {
  try {
    const contract = new web3.eth.Contract(ABI, COMPTROLLER_ADDRESS);
    const allMarkets = await contract.methods.getAllMarkets().call(null, block);
    const newMTokens = allMarkets.filter(
      (mtoken) => !mtokens[mtoken.toLowerCase()],
    );
    const underlyings = await util.executeCallOfMultiTargets(
      newMTokens,
      ABI,
      'underlying',
      [],
      block,
      chain,
      web3,
    );
    underlyings.forEach((underlying, index) => {
      mtokens[newMTokens[index].toLowerCase()] = underlying.toLowerCase();
    });
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  try {
    mtokens = await basicUtil.readFromCache('pools.json', chain, provider);
  } catch {}

  await getMarkets(block, chain, web3);
  await basicUtil.saveIntoCache(mtokens, 'pools.json', chain, provider);

  const mtokenList = Object.keys(mtokens);
  // Get V1 tokens locked
  const results = await util.executeCallOfMultiTargets(
    mtokenList,
    ABI,
    'getCash',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  results.forEach((result, index) => {
    if (result) {
      balanceResults.push({
        token: mtokens[mtokenList[index]],
        balance: BigNumber(result),
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);
  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
