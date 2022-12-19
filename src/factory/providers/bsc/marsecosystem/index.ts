import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import CHEF_ABI from './abi.json';
import STRAT_ABI from './strat.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import util from '../../../../util/blockchainUtil';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const IMO_ADDRESS = '0x243DDd2E42CEb93349E726e2367EDeC6339aba75';
const STAKE_ADDRESS = '0x3b550BBFaC32Ec434F858a8135fa17C40636583B';
const AIRDROP_ADDRESS = '0x01D152fF991E76b6cb310387c07cAfdFda790a25';
const MINING_ADDRESS = '0xc7B8285a9E099e8c21CA5516D23348D8dBADdE4a';
const XMS_ADDRESS = '0x7859b01bbf675d67da8cd128a50d155cd881b576';
const FACTORY_ADDRESS = '0x6f12482D9869303B998C54D91bCD8bCcba81f3bE';
const CHEF_ADDRESS = '0xb7881F5142245531C3fB938a37b5D2489EFd2C01';
let pools = {};

async function getWants(contract, id) {
  try {
    if (!pools[id]) {
      const poolInfo = await contract.methods.poolInfo(id).call();
      pools[id] = {
        want: poolInfo.want.toLowerCase(),
        strat: poolInfo.strat,
      };
    }
  } catch {}
}

async function stakedBalance(block, chain, provider, web3) {
  if (block < 10528620) {
    return {};
  }

  const contract = new web3.eth.Contract(CHEF_ABI, CHEF_ADDRESS);
  let poolLength;
  try {
    poolLength = await contract.methods.poolLength().call(null, block);
  } catch {
    return {};
  }

  const poolIDs = Array.from({ length: poolLength }, (v, i) => i);

  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  await Promise.all(poolIDs.map((id) => getWants(contract, id)));

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    poolIDs.map((id) => pools[id].strat),
    STRAT_ABI,
    'sharesTotal',
    [],
    block,
    chain,
    web3,
  );

  const wantBalances = [];
  poolIDs.forEach((id) => {
    const balance = BigNumber(results[id] || 0);
    if (balance.isGreaterThan(0)) {
      wantBalances.push({
        token: pools[id].want,
        balance,
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, wantBalances);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  return { balances };
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 8278392) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  const results = await util.executeMultiCallsOfTarget(
    XMS_ADDRESS,
    ERC20_ABI,
    'balanceOf',
    [[IMO_ADDRESS], [STAKE_ADDRESS], [AIRDROP_ADDRESS], [MINING_ADDRESS]],
    block,
    chain,
    web3,
  );
  results.forEach((result) => {
    const balance = BigNumber(result || 0);
    balances[XMS_ADDRESS] = BigNumber(balances[XMS_ADDRESS] || 0)
      .plus(balance)
      .toFixed();
  });

  const stakedBalances = await stakedBalance(block, chain, provider, web3);

  for (const token in stakedBalances) {
    const balance = BigNumber(stakedBalances[token] || 0);
    if (balance.isGreaterThan(0)) {
      if (!balances[token]) {
        balances[token] = balance.toFixed();
      } else {
        balances[token] = BigNumber(balances[token]).plus(balance).toFixed();
      }
    }
  }

  for (const token in balances) {
    if (BigNumber(balances[token]).isLessThan(100000)) {
      delete balances[token];
    } else {
      balances[token] = BigNumber(balances[token]).toFixed();
    }
  }

  //

  return { balances, poolBalances };
}

export { tvl };
