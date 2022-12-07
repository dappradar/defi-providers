/*==================================================
  Modules
  ==================================================*/

import util from '../../../sdk/util';
import chainWeb3 from '../../../sdk/web3SDK/chainWeb3';

/*==================================================
  Settings
  ==================================================*/

const walletAddresses = [
  'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-core-v1',
  'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-core-v1',
  'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-core-v2',
  'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-core-v2',
];
const tokenAddresses = [
  'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27.miamicoin-token',
  'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.newyorkcitycoin-token',
  'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token-v2',
  'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11.newyorkcitycoin-token-v2',
];

/*==================================================
  Helper Functions
  ==================================================*/

async function calculate(walletAddress, block, balances, chain) {
  const web3 = chainWeb3.getWeb3(chain);

  const accountBalances = await web3.eth.getAccountBalances(
    walletAddress,
    block,
  );

  web3.eth.extractBalances(accountBalances, balances, tokenAddresses);
}

/*==================================================
  TVL
  ==================================================*/

async function tvl(params) {
  const { block, chain } = params;

  if (block < 24341) {
    return {};
  }

  const balances = {};

  for (const walletAddress of walletAddresses) {
    await calculate(walletAddress, block, balances, chain);
  }

  util.convertBalancesToFixed(balances);

  return { balances };
}

/*==================================================
  Exports
  ==================================================*/

export { tvl };
