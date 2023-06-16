import BigNumber from 'bignumber.js';
import VAULT_ABI from './abi/vault.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import { log } from '../../../../util/logger/logger';
import vaults from './currentVaults.json';
const FACTORY_ADDRESS = '0x2FC1B142aF4d0422f554947Cd5FCaA0CceA44199';
let data = {};

async function getTokens(address, web3) {
  try {
    if (!data[address]) {
      const contract = new web3.eth.Contract(VAULT_ABI, address);
      try {
        data[address] = await contract.methods.token().call();
      } catch (e) {
        log.error({
          message: e?.message || '',
          stack: e?.stack || '',
          detail: `Error: getTokens of polygon/adamant`,
          endpoint: 'getTokens',
        });
      }
      data[address] = data[address].toLowerCase();
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 15207743) {
    return {};
  }

  // const contract = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS);
  // const vaults = await contract.methods.getDeployedVaults().call(null, block);

  try {
    data = await basicUtil.readDataFromFile('pools.json', chain, provider);
  } catch {}

  await Promise.all(vaults.map((vault) => getTokens(vault, web3)));
  await basicUtil.writeDataToFile(data, 'pools.json', chain, provider);

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
  vaults.forEach((address, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: data[address],
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
