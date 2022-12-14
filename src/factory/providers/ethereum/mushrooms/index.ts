import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import VAULT_ABI from './abi.json';
import VAULTS from './currentVaults.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

let data = {};

async function getTokens(address, web3) {
  try {
    if (!data[address]) {
      const contract = new web3.eth.Contract(VAULT_ABI, address);
      try {
        data[address] = await contract.methods.token().call();
      } catch (e) {
        console.log(e);
      }
      data[address] = data[address].toLowerCase();
    }
  } catch {}
  return null;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11156630) {
    return {};
  }

  try {
    data = basicUtil.readDataFromFile('pools.json', chain, provider);
  } catch {}

  await Promise.all(VAULTS.map((vault) => getTokens(vault, web3)));
  basicUtil.writeDataToFile(data, 'pools.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    VAULTS,
    VAULT_ABI,
    'balance',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = [];

  VAULTS.forEach((address, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: data[address],
        balance,
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );
  return { balances };
}

export { tvl };
