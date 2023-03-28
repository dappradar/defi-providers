import BigNumber from 'bignumber.js';
import fetch from 'node-fetch';
import VAULT_ABI from './abi.json';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 8409815;
const VAULTS_URI = 'https://api.beefy.finance/vaults';
let wants = {};

async function getVaults() {
  try {
    const vaults = await fetch(VAULTS_URI)
      .then((res) => res.json())
      .then((res) => res.filter((vault) => vault.chain == 'fantom'));

    return vaults.map((vault) => vault.earnContractAddress.toLowerCase());
  } catch (err) {
    log.error({
      message: err?.message || '',
      stack: err?.stack || '',
      detail: `Error: getVaults of fantom/beefyfinance`,
      endpoint: 'getVaults',
    });
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

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

  try {
    wants = basicUtil.readDataFromFile('cache/wants.json', chain, provider);
  } catch {}

  const vaults = await getVaults();
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
