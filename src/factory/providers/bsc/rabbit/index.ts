import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import BANK_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const BANK_ADDRESS = '0xc18907269640D11E2A91D7204f33C5115Ce3419e';
const WBNB_ADDRESS = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
let pools = {};

async function getTokens(contract, pid, block) {
  try {
    if (!pools[pid]) {
      const productions = await contract.methods
        .productions(pid)
        .call(null, block);
      pools[pid] = [
        productions.coinToken.toLowerCase(),
        productions.currencyToken.toLowerCase(),
        productions.borrowToken.toLowerCase(),
      ];
    }
    return pools[pid];
  } catch {
    return [];
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 7513584) {
    return {};
  }

  const contract = new web3.eth.Contract(BANK_ABI, BANK_ADDRESS);
  const pid = await contract.methods.currentPid().call(null, block);

  const tokenCalls = [];
  for (let i = 0; i < pid; i++) {
    tokenCalls.push(getTokens(contract, i, block));
  }

  try {
    pools = await basicUtil.readDataFromFile(
      'cache/pools.json',
      chain,
      provider,
    );
  } catch {}

  const tokenResults = await Promise.all(tokenCalls);

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const tokens = [];
  tokenResults.forEach((results) => {
    results.forEach((token) => {
      if (token) {
        if (!tokens.includes(token)) {
          tokens.push(token);
        }
      }
    });
  });

  const results = await util.executeMultiCallsOfTarget(
    BANK_ADDRESS,
    BANK_ABI,
    'totalToken',
    tokens.map((token) => [token]),
    block,
    chain,
    web3,
  );

  const balanceResults = [];

  tokens.forEach((token, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: token == util.ZERO_ADDRESS ? WBNB_ADDRESS : token,
        balance,
      });
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
