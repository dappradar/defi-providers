import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { gql, request } from 'graphql-request';
import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';

const GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/messari/curve-finance-ethereum';
const QUERY_SIZE = 200;
const POOLS = gql`
  query getPools($block: Int) {
    liquidityPools(
      block: { number: $block }
      first: ${QUERY_SIZE}  
      orderBy: totalValueLockedUSD 
      orderDirection: desc) {
    inputTokens {
      id
    }
    inputTokenBalances
    }
  }
`;

const CRV_USD_POOL_FACTORIES = [
  {
    factory: '0x818709b85052ddc521fae9c78737b27316337e3a',
    startBlock: 17182152,
  },
  {
    factory: '0x30a2F3c3AA6D12C0a36Bed210dCF1B32EF6228Cc',
    startBlock: 17187330,
  },
  {
    factory: '0xfa3e2db8eb6c646e0d24046c1a185934d41a8f7a',
    startBlock: 17187330,
  },
  {
    factory: '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC',
    startBlock: 17187330,
  },
];

async function getCrvUsdPoolsTokenBalances(block, chain, provider, web3) {
  const blocksLimit = 10000;
  const poolLogs = [];

  let data = { lastScannedblock: 0, holders: [], tokens: [] };
  try {
    data = await basicUtil.readFromCache('crvUsdData.json', chain, provider);
  } catch {}

  for (let i = 0, l = CRV_USD_POOL_FACTORIES.length; i < l; i++) {
    if (CRV_USD_POOL_FACTORIES[i].startBlock < block) {
      for (
        let j = Math.max(
          CRV_USD_POOL_FACTORIES[i].startBlock,
          data.lastScannedblock,
        );
        j < block;
        j += blocksLimit
      ) {
        const logs = await util.getDecodedLogsParameters(
          j,
          Math.min(j + blocksLimit, block),
          '0xebbe0dfde9dde641808b7a803882653420f3a5b12bb405d238faed959e1e3aa3',
          CRV_USD_POOL_FACTORIES[i].factory,
          'collateral',
          [
            { type: 'address', name: 'controller' },
            { type: 'address', name: 'amm' },
            { type: 'address', name: 'monetary_policy' },
            { type: 'uint256', name: 'ix' },
          ],
          web3,
        );

        Array.prototype.push.apply(poolLogs, logs);
        logs.forEach((decodedLogParameters) => {
          data.holders.push(decodedLogParameters.amm.toLowerCase());
          data.tokens.push(decodedLogParameters.collateral.toLowerCase());
        });
      }
    }
  }

  data.lastScannedblock = block;
  await basicUtil.saveIntoCache(data, 'crvUsdData.json', chain, provider);

  return await util.getTokenBalancesOfHolders(
    data.holders,
    data.tokens,
    block,
    chain,
    web3,
  );
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  const requestResult = await request(GRAPHQL_API, POOLS, {
    block: block,
  });
  requestResult.liquidityPools.forEach((liquidityPool) => {
    for (let i = 0; i < liquidityPool.inputTokens.length; i++) {
      balances[liquidityPool.inputTokens[i].id] = BigNumber(
        balances[liquidityPool.inputTokens[i].id] || 0,
      ).plus(liquidityPool.inputTokenBalances[i]);
    }
  });
  delete balances['0xd533a949740bb3306d119cc777fa900ba034cd52'];

  const crvUsdPoolsTokenBalances = await getCrvUsdPoolsTokenBalances(
    block,
    chain,
    provider,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, crvUsdPoolsTokenBalances);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
