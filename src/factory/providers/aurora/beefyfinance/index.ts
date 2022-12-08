import fs from 'fs';
import BigNumber from 'bignumber.js';
import fetch from 'node-fetch';
import VAULT_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 58633327;
const VAULTS_URI = 'https://api.beefy.finance/vaults';
let wants = {};

/*==================================================
  Helpers
  ==================================================*/

async function getVaults() {
  try {
    const vaults = await fetch(VAULTS_URI)
      .then((res) => res.json())
      .then((res) => res.filter((vault) => vault.chain == 'aurora'));

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

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

  try {
    wants = JSON.parse(
      fs.readFileSync('./providers/aurora_beefyfinance/wants.json', 'utf8'),
    );
  } catch {}

  const vaults = await getVaults();
  await Promise.all(
    vaults
      .filter((vault) => !wants[vault])
      .map((vault) => getWants(vault, web3)),
  );

  fs.writeFile(
    './providers/aurora_beefyfinance/wants.json',
    JSON.stringify(wants, null, 2),
    'utf8',
    function (err) {
      if (err) {
        console.error(err);
      }
    },
  );

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
  formatter.sumMultiBalanceOf(tokenBalances, wantBalances);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  return { balances };
}

export { tvl };
