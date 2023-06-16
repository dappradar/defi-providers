import BigNumber from 'bignumber.js';
import fetch from 'node-fetch';
import Web3 from 'web3';
import util from '../blockchainUtil';
import basicUtil from '../basicUtil';
import VAULT_ABI from '../../constants/abi/beefyVault.json';
import formatter from '../formatter';
import { IBalances } from '../../interfaces/ITvl';
import { log } from '../logger/logger';

const VAULTS_URI = 'https://api.beefy.finance/vaults';
let wants = {};

async function getVaults(chain) {
  try {
    const vaults = await fetch(VAULTS_URI)
      .then((res) => res.json())
      .then((res) => res.filter((vault) => vault.chain == chain));

    return vaults.map((vault) => vault.earnContractAddress.toLowerCase());
  } catch (err) {
    log.error({
      message: err?.message || '',
      stack: err?.stack || '',
      detail: `Error: sumMultiBalanceOf beefyfinance`,
      endpoint: 'sumMultiBalanceOf',
    });
    throw err;
  }
}

async function getWants(address, web3) {
  try {
    const contract = new web3.eth.Contract(VAULT_ABI, address);
    const want = await contract.methods.want().call();
    wants[address] = want.toLowerCase();
  } catch (err) {
    log.error({
      message: err?.message || '',
      stack: err?.stack || '',
      detail: `Error: getWants beefyfinance`,
      endpoint: 'getWants',
    });
  }
}

/**
 * Gets TVL of Beefy Finance
 *
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param provider - the provider folder name
 * @param web3 - The Web3 object
 * @returns The object containing token addresses and their locked values
 *
 */
async function getTvl(
  block: number,
  chain: string,
  provider: string,
  web3: Web3,
): Promise<IBalances> {
  try {
    wants = await basicUtil.readFromCache('cache/wants.json', chain, provider);
  } catch {}

  const vaults = await getVaults(chain);
  await Promise.all(
    vaults
      .filter((vault) => !wants[vault])
      .map((vault) => getWants(vault, web3)),
  );

  basicUtil.savedIntoCache(wants, 'cache/wants.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    vaults,
    VAULT_ABI,
    'balance',
    [],
    block,
    chain,
    web3,
  );

  const wantBalances = [];
  vaults.forEach((vault, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0) && wants[vault] !== undefined) {
      wantBalances.push({
        token: wants[vault],
        balance,
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, wantBalances, chain, provider);

  return await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );
}

export default {
  getTvl,
};
