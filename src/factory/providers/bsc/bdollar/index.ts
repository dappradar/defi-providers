import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import POOL_ABI from './abis/abi.json';
import TREASURY_ABI from './abis/treasuryabi.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const TREASURY_ADDRESS = '0x15A90e6157a870CD335AF03c6df776d0B1ebf94F';
const CHEF_ADDRESSES = [
  '0x7A4cFC24841c799832fFF4E5038BBA14c0e73ced',
  '0x948dB1713D4392EC04C86189070557C5A8566766',
];
let pools = {
  farmingPools: {},
  lpTokens: {},
};

async function getLPTokens(address, block, web3) {
  const contract = new web3.eth.Contract(POOL_ABI, address);
  if (!pools.lpTokens[address]) {
    pools.lpTokens[address] = [];
  }
  for (let index = pools.lpTokens[address].length; ; index += 1) {
    try {
      const poolInfo = await contract.methods.poolInfo(index).call(null, block);
      pools.lpTokens[address].push(poolInfo.lpToken.toLowerCase());
    } catch {
      break;
    }
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  try {
    pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {}

  const treasuryContract = new web3.eth.Contract(
    TREASURY_ABI,
    TREASURY_ADDRESS,
  );
  const pegTokenLength = await treasuryContract.methods
    .pegTokenLength()
    .call(null, block);

  const newPoolIDs = Array.from({ length: pegTokenLength }, (v, i) => i).filter(
    (id) => !pools.farmingPools[id],
  );
  const pegTokens = await util.executeMultiCallsOfTarget(
    TREASURY_ADDRESS,
    TREASURY_ABI,
    'pegTokens',
    newPoolIDs.map((id) => [id]),
    block,
    chain,
    web3,
  );

  const newFarmingPools = await util.executeMultiCallsOfTarget(
    TREASURY_ADDRESS,
    TREASURY_ABI,
    'pegTokenFarmingPool',
    pegTokens.map((token) => [token]),
    block,
    chain,
    web3,
  );

  newPoolIDs.forEach((id, index) => {
    if (newFarmingPools[index]) {
      pools.farmingPools[id] = newFarmingPools[index];
    }
  });

  for (const id in pools.farmingPools) {
    const pool = pools.farmingPools[id];
    if (pool && !CHEF_ADDRESSES.includes(pool)) {
      CHEF_ADDRESSES.push(pool);
    }
  }

  await Promise.all(
    CHEF_ADDRESSES.map((address) => getLPTokens(address, block, web3)),
  );

  basicUtil.savedIntoCache(pools, 'cache/pools.json', chain, provider);

  let chefList = [];
  let lpTokens = [];
  CHEF_ADDRESSES.forEach((chef) => {
    chefList = chefList.concat(pools.lpTokens[chef].map((token) => [chef]));
    lpTokens = lpTokens.concat(pools.lpTokens[chef]);
  });

  const results = await util.executeMultiCallsOfMultiTargets(
    lpTokens,
    ERC20_ABI,
    'balanceOf',
    chefList,
    block,
    chain,
    web3,
  );

  const stakingTokenBalances = [];
  lpTokens.forEach((token, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      stakingTokenBalances.push({
        token,
        balance,
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(
    tokenBalances,
    stakingTokenBalances,
    chain,
    provider,
  );

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
