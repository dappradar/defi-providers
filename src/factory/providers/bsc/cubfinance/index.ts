import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import CHEF_ABI from './abis/abi.json';
import KINGDOM_CHEF_ABI from './abis/kingdom.json';
import STRAT_ABI from './abis/strat.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const KINGDOM_FARM_ADDRESS = '0x2E72f4B196b9E5B89C29579cC135756a00E6CBBd';
const CHEF_ADDRESS = '0x227e79c83065edb8b954848c46ca50b96cb33e16';
const BASE_TOKENS = {
  '0xa8bb71facdd46445644c277f9499dd22f6f0a30c':
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', //beltBNB -> wbnb
  '0x9cb73f20164e399958261c289eb5f9846f4d1404':
    '0x55d398326f99059ff775485246999027b3197955', // 4belt -> usdt
  '0x51bd63f240fb13870550423d208452ca87c44444':
    '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', //beltBTC->
  '0xaa20e8cb61299df2357561c2ac2e1172bc68bc25':
    '0x2170ed0880ac9a755fd29b2688956bd959f933f8', //beltETH->
};
let pools = {
  kingdom: {},
  chef: [],
};

async function getWants(contract, id) {
  try {
    if (!pools.kingdom[id]) {
      const poolInfo = await contract.methods.poolInfo(id).call();
      pools.kingdom[id] = {
        want: poolInfo.want.toLowerCase(),
        strat: poolInfo.strat,
      };
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 5193410) {
    return {};
  }

  try {
    pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {}

  const contract = new web3.eth.Contract(CHEF_ABI, CHEF_ADDRESS);

  let poolLength = 0;
  try {
    poolLength = await contract.methods.poolLength().call(null, block);
  } catch {}

  for (let i = pools.chef.length; i < poolLength; i += 1) {
    try {
      const pool = await contract.methods.poolInfo(i).call(null, block);
      pools.chef.push(pool.lpToken.toLowerCase());
    } catch {
      break;
    }
  }

  const tokenBalances = {};

  const availablePools = [...pools.chef];
  availablePools.splice(29, 1);
  availablePools.splice(27, 1);
  poolLength = availablePools.length;
  for (let first = 25; first < poolLength; first += 100) {
    const last = Math.min(poolLength, first + 100);
    const balanceResults = await util.getTokenBalances(
      CHEF_ADDRESS,
      availablePools.slice(first, last),
      block,
      chain,
      web3,
    );

    formatter.sumMultiBalanceOf(tokenBalances, balanceResults, chain, provider);
  }

  try {
    const kingdomContract = new web3.eth.Contract(
      KINGDOM_CHEF_ABI,
      KINGDOM_FARM_ADDRESS,
    );

    poolLength = 0;
    try {
      poolLength = await kingdomContract.methods.poolLength().call(null, block);
    } catch {}

    const poolIDs = Array.from({ length: poolLength }, (v, i) => i);

    await Promise.all(poolIDs.map((id) => getWants(kingdomContract, id)));

    basicUtil.savedIntoCache(pools, 'cache/pools.json', chain, provider);

    const results = await util.executeCallOfMultiTargets(
      poolIDs.map((id) => pools.kingdom[id].strat),
      STRAT_ABI,
      'wantLockedTotal',
      [],
      block,
      chain,
      web3,
    );

    const wantBalances = [];
    poolIDs.forEach((id) => {
      const balance = BigNumber(results[id] || 0);
      if (balance.isGreaterThan(0) && id != 4) {
        wantBalances.push({
          token: BASE_TOKENS[pools.kingdom[id].want] || pools.kingdom[id].want,
          balance,
        });
      }
    });

    formatter.sumMultiBalanceOf(tokenBalances, wantBalances, chain, provider);
  } catch {}

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
