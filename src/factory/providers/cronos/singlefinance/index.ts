import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const START_BLOCK = 2100000;
const SINGLE_VAULT = 'https://api.singlefinance.io/api/vaults?chainid=25';
const MASTERCHEF_API = 'https://api.singlefinance.io/api/strategies?chainid=25';

async function getMasterChefDetail(params) {
  const { block, chain, provider, web3 } = params;
  const { data } = (
    await axios.get(MASTERCHEF_API, {
      headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
    })
  ).data;
  const poolDetail = [];
  data.forEach((factoryInfo, index) => {
    if (factoryInfo.tvl !== '0')
      poolDetail.push({
        tokens: [
          factoryInfo.token0.address[25],
          factoryInfo.token1.address[25],
        ],
        holder: factoryInfo.lpToken.address[25],
      });
  });
  const promises = Object.values(poolDetail).map((detail) =>
    util.getTokenBalances(detail.holder, detail.tokens, block, chain, web3),
  );
  const balances = {};
  const allBalances = await Promise.all(promises);
  allBalances.forEach((balance) =>
    formatter.sumMultiBalanceOf(balances, balance, chain, provider),
  );
  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return { balances: {} };
  }
  const balances = await getMasterChefDetail(params);
  const { data } = (
    await axios.get(SINGLE_VAULT, {
      headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
    })
  ).data;
  const holder = [],
    tokens = [];
  data.forEach((poolDetail) => {
    holder.push(poolDetail.address);
    tokens.push(poolDetail.token.id);
  });
  const tokenBalances = await util.getTokenBalancesOfHolders(
    holder,
    tokens,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
