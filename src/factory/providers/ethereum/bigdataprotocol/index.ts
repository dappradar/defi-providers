import BigNumber from 'bignumber.js';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import bALPHA_CHEF_ABI from './balpha.json';
import BDP_CHEF_ABI from './bdp.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const bALPHA_CHEF_ADDR = '0xf20084ba368567fa3da1da85b43ac1ac310880c8';
const BDP_CHEF_ADDR = '0x0De845955E2bF089012F682fE9bC81dD5f11B372';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11968394) {
    return {};
  }

  const [bAlphaPoolLength, bdpPoolLength] =
    await util.executeCallOfMultiTargets(
      [bALPHA_CHEF_ADDR, BDP_CHEF_ADDR],
      bALPHA_CHEF_ABI,
      'poolLength',
      [],
      block,
      chain,
      web3,
    );

  const [bAlphaPoolInfos, bdpPoolInfos] = await Promise.all([
    util.executeMultiCallsOfTarget(
      bALPHA_CHEF_ADDR,
      bALPHA_CHEF_ABI,
      'poolInfo',
      Array.from({ length: bAlphaPoolLength }, (v, i) => [i]),
      block,
      chain,
      web3,
    ),
    util.executeMultiCallsOfTarget(
      BDP_CHEF_ADDR,
      BDP_CHEF_ABI,
      'poolInfo',
      Array.from({ length: bdpPoolLength }, (v, i) => [i]),
      block,
      chain,
      web3,
    ),
  ]);

  const tokenBalances = {};

  const [balpha_results, bdp_results] = await Promise.all([
    util.executeCallOfMultiTargets(
      bAlphaPoolInfos.map((info) => info.lpToken),
      ERC20_ABI,
      'balanceOf',
      [bALPHA_CHEF_ADDR],
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      bdpPoolInfos.map((info) => info.lpToken),
      ERC20_ABI,
      'balanceOf',
      [BDP_CHEF_ADDR],
      block,
      chain,
      web3,
    ),
  ]);

  const balanceResults = [];
  balpha_results.forEach((result, index) => {
    if (result) {
      balanceResults.push({
        token: bAlphaPoolInfos[index].lpToken.toLowerCase(),
        balance: BigNumber(result),
      });
    }
  });

  bdp_results.forEach((result, index) => {
    if (result) {
      balanceResults.push({
        token: bdpPoolInfos[index].lpToken.toLowerCase(),
        balance: BigNumber(result),
      });
    }
  });

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
