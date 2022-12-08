import BigNumber from 'bignumber.js';
import fetch from 'node-fetch';
import util from '../blockchainUtil';
import basicUtil from '../basicUtil';
import VAULT_ABI from '../../constants/abi/beefyVault.json';
import formatter from '../formatter';

const VAULTS_URI = 'https://api.beefy.finance/vaults';
let wants = {};

/*==================================================
  Helper Methods
  ==================================================*/

async function getVaults(chain) {
  try {
    const vaults = await fetch(VAULTS_URI)
      .then((res) => res.json())
      .then((res) => res.filter((vault) => vault.chain == chain));

    return vaults.map((vault) => vault.earnContractAddress.toLowerCase());
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getWants(address, web3) {
  try {
    const contract = new web3.eth.Contract(VAULT_ABI, address);
    const want = await contract.methods.want().call();
    wants[address] = want.toLowerCase();
  } catch {}
}

async function getTvl(block, chain, provider, web3) {
  try {
    wants = basicUtil.readDataFromFile('cache/wants.json', chain, provider);
  } catch {}

  const vaults = await getVaults(chain);
  await Promise.all(
    vaults
      .filter((vault) => !wants[vault])
      .map((vault) => getWants(vault, web3)),
  );

  basicUtil.writeDataToFile(wants, 'cache/wants.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    vaults,
    VAULT_ABI,
    'balance',
    [],
    block,
    chain,
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
  formatter.sumMultiBalanceOf(tokenBalances, wantBalances);

  return await util.convertToUnderlyings(tokenBalances, block, chain);
}

export default {
  getTvl,
};
