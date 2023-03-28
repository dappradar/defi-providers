import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import BigNumber from 'bignumber.js';
import BALANCER_VAULT_ABI from './abi.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import { log } from '../../../../util/logger/logger';

const MASTER_CHEF = '0x4897EB3257A5391d80B2f73FB0748CCd4150b586';

const TREASURY = '0xA3b52d5A6d2f8932a5cD921e09DA840092349D71';
const TREASURY_TOKENS = [
  '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
  '0x6fc9383486c163fa48becdec79d6058f984f62ca',
  '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
  '0xd77fc9c4074b56ecf80009744391942fbfddd88b',
];

const GNOSIS = '0x34F93b12cA2e13C6E64f45cFA36EABADD0bA30fC';
const GNOSIS_TOKENS = [
  '0x6fc9383486c163fa48becdec79d6058f984f62ca',
  '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
];

const TRADFI_3M = '0xEFbe7fe9E8b407a3F0C0451E7669E70cDD0C4C77';
const TRADFI_6M = '0xB1c77436BC180009709Be00C9e852246476321A3';
const TRADFI_TOKENS = ['0x6fc9383486c163fa48becdec79d6058f984f62ca'];

const STABLE_POOL = '0xd5e946b5619fff054c40d38c976f1d06c1e2fa82';
const STABLE_POOL_UNDERLYINGS = [
  '0x6fc9383486c163fa48becdec79d6058f984f62ca',
  '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
];
const STABLE_POOLID =
  '0xd5e946b5619fff054c40d38c976f1d06c1e2fa820002000000000000000003ac';
const BALANCER_VAULT = '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 20186941) {
    return {};
  }

  const [treasuryBalances, gnosisBalances, tradfiBalances] = await Promise.all([
    util.getTokenBalances(TREASURY, TREASURY_TOKENS, block, chain, web3),
    util.getTokenBalances(GNOSIS, GNOSIS_TOKENS, block, chain, web3),
    util.getTokenBalancesOfEachHolder(
      [TRADFI_3M, TRADFI_6M],
      TRADFI_TOKENS,
      block,
      chain,
      web3,
    ),
  ]);

  const [poolTokenData, reserves] = await Promise.all([
    util.executeDifferentCallsOfTarget(
      STABLE_POOL,
      ERC20_ABI,
      ['balanceOf', 'balanceOf', 'totalSupply'],
      [[TREASURY], [MASTER_CHEF], []],
      block,
      chain,
      web3,
    ),
    util.executeMultiCallsOfTarget(
      BALANCER_VAULT,
      BALANCER_VAULT_ABI,
      'getPoolTokenInfo',
      STABLE_POOL_UNDERLYINGS.map((underlying) => [STABLE_POOLID, underlying]),
      block,
      chain,
      web3,
    ),
  ]);

  try {
    const rate = BigNumber(poolTokenData[0] || '0')
      .plus(poolTokenData[1] || '0')
      .div(poolTokenData[2]);
    STABLE_POOL_UNDERLYINGS.forEach((underlying, index) => {
      treasuryBalances.push({
        token: underlying,
        balance: rate.times(reserves[index].cash),
      });
    });
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of fantom/fantohm`,
      endpoint: 'tvl',
    });
  }

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, treasuryBalances, chain, provider);
  formatter.sumMultiBalanceOf(tokenBalances, gnosisBalances, chain, provider);
  formatter.sumMultiBalanceOf(tokenBalances, tradfiBalances, chain, provider);

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
