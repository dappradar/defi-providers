import basicUtil from '../../../../util/basicUtil';
import VAULT_ABI from './abi.json';
import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import vaults from './currentVaults.json';

const SPACE_ADDRESS = '0xe486a69e432fdc29622bf00315f6b34c99b45e80';
let data = {};

async function getStakingTokens(address, web3) {
  try {
    if (!data[address]) {
      const contract = new web3.eth.Contract(VAULT_ABI, address);
      try {
        data[address] = await contract.methods.stakingToken().call();
      } catch (e) {
        data[address] = SPACE_ADDRESS;
      }
      data[address] = data[address].toLowerCase();
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 7550918) {
    return {};
  }

  try {
    data = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {}

  await Promise.all(vaults.map((vault) => getStakingTokens(vault, web3)));

  basicUtil.savedIntoCache(data, 'cache/pools.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    vaults,
    VAULT_ABI,
    'balance',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  vaults.forEach((vault, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: data[vault],
        balance,
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults, chain, provider);

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
