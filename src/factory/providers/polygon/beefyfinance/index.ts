import BigNumber from 'bignumber.js';
import fetch from 'node-fetch';
import util from '../../../../util/blockchainUtil';
import VAULT_ABI from './abi.json';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 13908161;
const VAULTS_URI = 'https://api.beefy.finance/vaults';
const BIFI_TOKEN = '0xfbdd194376de19a88118e84e279b977f165d01b8';
const BIFI_MAXI_VAULT = '0xfecf784f48125ccb7d8855cdda7c5ed6b5024cb3';
const BIFI_STAKING_CONTRACT = '0xdeb0a777ba6f59c78c654b8c92f80238c8002dd2';
const EURT_DAI_USDC_USDT_VAULT = '0x108c7a293162adff86da216ab5f91e56723125dc';
const CURVE_AM3_VAULT = '0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171';
let wants = {};

async function getVaults() {
  try {
    const vaults = await fetch(VAULTS_URI)
      .then((res) => res.json())
      .then((res) => res.filter((vault) => vault.chain == 'polygon'))
      .then((res) =>
        //BIFI Maxi vault is excluded
        res.filter(
          (vault) => vault.earnContractAddress.toLowerCase() != BIFI_MAXI_VAULT,
        ),
      );

    return vaults.map((vault) => vault.earnContractAddress.toLowerCase());
  } catch (err) {
    log.error({
      message: err?.message || '',
      stack: err?.stack || '',
      detail: `Error: getVaults of polygon/beefyfinanace`,
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
    wants = await basicUtil.readDataFromFile(
      'cache/pairs.json',
      chain,
      provider,
    );
  } catch {}

  const vaults = await getVaults();
  await Promise.all(
    vaults
      .filter((vault) => !wants[vault])
      .map((vault) => getWants(vault, web3)),
  );

  basicUtil.writeDataToFile(wants, 'cache/wants.json', chain, provider);

  const [results, stakingContractBalances] = await Promise.all([
    util.executeCallOfMultiTargets(
      vaults,
      VAULT_ABI,
      'balance',
      [],
      block,
      chain,
      web3,
    ),
    util.getTokenBalances(
      BIFI_STAKING_CONTRACT,
      [BIFI_TOKEN],
      block,
      chain,
      web3,
    ), // BIFI Maxi vault + BIFI Earnings Pool
  ]);

  // EURt/DAI/USDC/USDT vault consists of EURt and DAI/USDC/USDT vault so it has to be added manually to get underlyings
  if (vaults.includes(EURT_DAI_USDC_USDT_VAULT)) {
    vaults.push(CURVE_AM3_VAULT);
    wants[CURVE_AM3_VAULT] = CURVE_AM3_VAULT;
    results[vaults.findIndex((element) => element == CURVE_AM3_VAULT)] =
      results[
        vaults.findIndex((element) => element == EURT_DAI_USDC_USDT_VAULT)
      ];
  }

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
  formatter.sumMultiBalanceOf(tokenBalances, stakingContractBalances);

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
