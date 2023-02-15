import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import PAIR_ABI from './abis/abi.json';
import UNITROLLER_ABI from './abis/unitroller.json';
import OLA_TOKEN_ABI from './abis/ola_token.json';
import { WMAIN_ADDRESS } from '../../../../constants/contracts.json';
import util from '../../../../util/blockchainUtil';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const TOKEN_ADDRESS = '0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95';
const MASTER_ADDRESS = '0x5c8D727b265DBAfaba67E050f2f739cAeEB4A6F9';
const FACTORY_ADDRESS = '0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6';
const UNITROLLER_ADDRESS = '0xad48b2c9dc6709a560018c678e918253a65df86e';
const GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/hhassan01/apeswap-subgraph';
const QUERY_SIZE = 400;

async function unitroller(block, chain, provider, web3) {
  if (block < 12871489) {
    return [];
  }

  let olaTokens = {};
  try {
    olaTokens = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const allMarkets = await util.executeCall(
    UNITROLLER_ADDRESS,
    UNITROLLER_ABI,
    'getAllMarkets',
    [],
    block,
    chain,
    web3,
  );

  const newMarkets = allMarkets.filter((market) => !olaTokens[market]);

  if (newMarkets.length > 0) {
    const underlyings = await util.executeCallOfMultiTargets(
      newMarkets,
      OLA_TOKEN_ABI,
      'underlying',
      [],
      block,
      chain,
      web3,
    );

    underlyings.forEach((underlying, index) => {
      olaTokens[newMarkets[index]] = (
        underlying || WMAIN_ADDRESS.bsc
      ).toLowerCase();
    });

    basicUtil.writeDataToFile(olaTokens, 'cache/pools.json', chain, provider);
  }

  const results = await util.executeDifferentCallsOfMultiTargets(
    [...allMarkets, ...allMarkets],
    OLA_TOKEN_ABI,
    [
      ...allMarkets.map((_) => 'getCash'),
      ...allMarkets.map((_) => 'totalBorrows'),
    ],
    [...allMarkets.map((_) => []), ...allMarkets.map((_) => [])],
    block,
    chain,
    web3,
  );

  const tokenBalances = [];
  const marketLength = allMarkets.length;

  results.forEach((result, index) => {
    if (result) {
      if (index < marketLength) {
        tokenBalances.push({
          token: olaTokens[allMarkets[index]],
          balance: BigNumber(result),
        });
      } else {
        const tokenIndex = index - marketLength;
        tokenBalances[tokenIndex] = {
          token: tokenBalances[tokenIndex].token,
          balance: tokenBalances[tokenIndex].balance.plus(BigNumber(result)),
        };
      }
    }
  });

  // Lending contract stores BNB under 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee token address
  // This address is renamed to WBNB address
  const objIndex = tokenBalances.findIndex(
    (obj) => obj.token == '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  );
  if (objIndex != -1) {
    tokenBalances[objIndex].token = WMAIN_ADDRESS.bsc;
  }

  return tokenBalances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 4855901) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  // Staking
  const tokenContract = new web3.eth.Contract(PAIR_ABI, TOKEN_ADDRESS);
  const tokenBalance = await tokenContract.methods
    .balanceOf(MASTER_ADDRESS)
    .call(null, block);
  balances[TOKEN_ADDRESS] = BigNumber(balances[TOKEN_ADDRESS] || 0)
    .plus(tokenBalance)
    .toFixed();

  // Lending
  const unitrollerBalances = await unitroller(block, chain, provider, web3);
  formatter.sumMultiBalanceOf(balances, unitrollerBalances, chain, provider);

  for (const token in balances) {
    if (BigNumber(balances[token]).isLessThan(100000)) {
      delete balances[token];
    } else {
      balances[token] = BigNumber(balances[token]).toFixed();
    }
  }

  return { balances, poolBalances };
}

async function getPoolVolumes(params) {
  const { pools, block } = params;

  const poolVolumes = await uniswapV2.getPoolVolumes(
    GRAPHQL_API,
    QUERY_SIZE,
    pools,
    block,
    null,
  );

  return poolVolumes;
}

async function getTokenVolumes(params) {
  const { tokens, block } = params;

  const tokenVolumes = await uniswapV2.getTokenVolumes(
    GRAPHQL_API,
    QUERY_SIZE,
    tokens,
    block,
    {
      volume: 'tradeVolume',
      volumeUsd: 'tradeVolumeUSD',
    },
  );

  return tokenVolumes;
}

export { tvl, getPoolVolumes, getTokenVolumes };
