import BigNumber from 'bignumber.js';
import COLLATERAL_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';

const CREATOR = '0xddfc7e3b4531158acf4c7a5d2c3cb0ee81d018a5';
const STARTBLOCK = 11876441;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < STARTBLOCK) {
    return {};
  }

  let pools;
  try {
    pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {
    pools = {
      start: STARTBLOCK,
      pools: [],
    };
  }

  const blocksLimit = 10000;
  const poolLogs = [];
  for (let i = Math.max(STARTBLOCK, pools.start); i < block; i += blocksLimit) {
    const logs = (
      await util.getLogs(
        i,
        Math.min(i + blocksLimit, block),
        '0xf360b00b309dfe6565667df6b06eab15d0e0958d5e82d89a399ae7dd417b4b09',
        CREATOR,
        web3,
      )
    ).output;
    Array.prototype.push.apply(poolLogs, logs);
  }

  const financialContracts = poolLogs.map((log) =>
    `0x${log.topics[1].slice(64 - 40 + 2, 64 + 2)}`.toLowerCase(),
  );

  const collaterals = await util.executeCallOfMultiTargets(
    financialContracts,
    COLLATERAL_ABI,
    'collateralCurrency',
    [],
    block,
    chain,
    web3,
  );

  const CollateralResults = pools.pools.concat(
    collaterals
      .map((result, index) => ({
        contract: financialContracts[index],
        currency: result ? result.toLowerCase() : result,
      }))
      .filter((result) => result.currency),
  );

  await basicUtil.saveIntoCache(
    {
      start: block,
      pools: CollateralResults,
    },
    'cache/pools.json',
    chain,
    provider,
  );

  const results = await util.executeCallOfMultiTargets(
    CollateralResults.map((result) => result.contract),
    COLLATERAL_ABI,
    'totalPositionCollateral',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = [];

  CollateralResults.forEach((result, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: result.currency,
        balance,
      });
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
