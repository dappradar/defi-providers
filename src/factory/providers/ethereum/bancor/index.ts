import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import abi from './abi.json';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const V3_START_BLOCK = 14609331;
const BANCOR_VAULT_V3 = '0x649765821D9f64198c905eC0B2B037a4a52Bc373';
const THE_GRAPH_API_KEY = process.env?.THE_GRAPH_API_KEY;
const THEGRAPTH_ENDPOINT = `https://gateway.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/4Q4eEMDBjYM8JGsvnWCafFB5wCu6XntmsgxsxwYSnMib`;
const TOKENS_QUERY = gql`
  query getTokens($block: Int!) {
    tokens(first: 1000, block: { number: $block }) {
      id
    }
  }
`;

async function generateCallsByBlockchain(block, chain, provider, web3) {
  let result;
  let converterRegistryAddress;

  if (block < 10350881) {
    converterRegistryAddress = '0xf6E2D7F616B67E46D708e4410746E9AAb3a4C518';
  } else {
    converterRegistryAddress = '0xC0205e203F423Bcd8B2a4d6f8C8A154b0Aa60F19';
  }

  try {
    // get pool anchor addresses
    result = await util.executeCall(
      converterRegistryAddress,
      [abi['abiConverterRegistryGetPools']],
      'getLiquidityPools',
      [],
      block,
      chain,
      web3,
    );
    if (!result) {
      return null;
    }

    // get converter addresses
    result = await util.executeCall(
      converterRegistryAddress,
      [abi['abiRegistryGetConvertersBySmartTokens']],
      'getConvertersBySmartTokens',
      [result],
      block,
      chain,
      web3,
    );

    let token01Infos = {};
    try {
      token01Infos = await basicUtil.readFromCache(
        'cache/token01.json',
        chain,
        provider,
      );
    } catch {}
    // get reserve token addresses (currently limited to 2)
    const converterAddresses = result;
    const reserveTokenCallTargets = [];
    const reserveTokenCallParams = [];
    for (let i = 0; i < converterAddresses.length; i++) {
      if (!token01Infos[`${converterAddresses[i]}_0`]) {
        reserveTokenCallTargets.push(converterAddresses[i]);
        reserveTokenCallParams.push([0]);
      }
      if (!token01Infos[`${converterAddresses[i]}_1`]) {
        reserveTokenCallTargets.push(converterAddresses[i]);
        reserveTokenCallParams.push([1]);
      }
    }

    result = await util.executeMultiCallsOfMultiTargets(
      reserveTokenCallTargets,
      [abi['abiConverterConnectorTokens']],
      'connectorTokens',
      reserveTokenCallParams,
      block,
      chain,
      web3,
    );

    for (let i = 0; i < result.length; i++) {
      token01Infos[
        `${reserveTokenCallTargets[i]}_${reserveTokenCallParams[i]}`
      ] = result[i];
    }

    await basicUtil.saveIntoCache(
      token01Infos,
      'cache/token01.json',
      chain,
      provider,
    );

    // create reserve balance calls
    const balanceCalls = [];
    for (const target in token01Infos) {
      balanceCalls.push({
        target: token01Infos[target],
        params: [target.split('_')[0]],
      });
    }

    return balanceCalls;
  } catch {
    return null;
  }
}

async function v2tvl(block, chain, provider, web3) {
  const balanceCalls = await generateCallsByBlockchain(
    block,
    chain,
    provider,
    web3,
  );

  // get ETH balances
  const balances = {
    [WETH_ADDRESS]: await web3.eth.getBalance(
      '0xc0829421C1d260BD3cB3E0F06cfE2D52db2cE315',
      block,
    ),
  };

  if (balanceCalls) {
    const ethReserveAddresses = [
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      '0xc0829421c1d260bd3cb3e0f06cfe2d52db2ce315',
    ];
    const ethBalanceCalls = balanceCalls.filter((call) =>
      ethReserveAddresses.includes(call.target.toLowerCase()),
    );

    const ethBalances = await Promise.all(
      ethBalanceCalls.map((call) => web3.eth.getBalance(call.params[0], block)),
    );
    ethBalances.forEach(
      (balance) =>
        (balances[WETH_ADDRESS] = BigNumber(balances[WETH_ADDRESS]).plus(
          BigNumber(balance.toString()).multipliedBy(2),
        )),
    );

    const balanceResults = await util.getTokenBalancesOfHolders(
      balanceCalls.map((call) => call.params[0]),
      balanceCalls.map((call) => call.target),
      block,
      chain,
      web3,
    );

    formatter.sumMultiBalanceOf(balances, balanceResults);
  }
  return balances;
}

async function v3tvl(balances, block, chain, web3) {
  if (block < V3_START_BLOCK) {
    return;
  }

  try {
    const tokens = await request(THEGRAPTH_ENDPOINT, TOKENS_QUERY, {
      block,
    }).then((data) => data.tokens);

    const tokenAddresses = [];
    tokens.forEach((token) => {
      tokenAddresses.push(token.id);
    });

    const v3Balances = await util.getTokenBalances(
      BANCOR_VAULT_V3,
      tokenAddresses,
      block,
      chain,
      web3,
    );
    v3Balances
      .filter((token) => BigNumber(token.balance).isGreaterThan(0))
      .forEach((tokenBalance) => {
        balances[tokenBalance.token] = BigNumber(
          balances[tokenBalance.token] || 0,
        ).plus(tokenBalance.balance);
      });

    const ethBalance = await util.getBalancesOfHolders(
      [BANCOR_VAULT_V3],
      block,
      chain,
      web3,
    );
    formatter.sumMultiBalanceOf(balances, ethBalance);
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: v3tvl of ethereum/bancor`,
      endpoint: 'v3tvl',
    });
    throw e;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = await v2tvl(block, chain, provider, web3);

  await v3tvl(balances, block, chain, web3);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
