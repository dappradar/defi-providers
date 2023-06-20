import BigNumber from 'bignumber.js';
import VERSION_ABI from './abi/v1abi.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

const VERSIONS = [
  '0xCB6c6Bdf0AA4cF0188518783b871931EFB64248f',
  '0x01Bde0b02740D6311e4a87CA112DeEEddb057EFB',
  '0x5f9AE054C7F0489888B1ea46824b4B9618f8A711',
];
let ACCOUNTING_INFO = {};

async function getTokenBalance(address, block, chain, web3) {
  try {
    const contract = new web3.eth.Contract(VERSION_ABI, address);
    const lastFundId = await contract.methods.getLastFundId().call(null, block);

    const newIDs = Array.from({ length: lastFundId }, (v, i) => i).filter(
      (id) => !ACCOUNTING_INFO[address] || !ACCOUNTING_INFO[address][id],
    );

    const fundAddresses = await util.executeMultiCallsOfTarget(
      address,
      VERSION_ABI,
      'getFundById',
      newIDs.map((id) => [id]),
      block,
      chain,
      web3,
    );
    const accountings = await util.executeCallOfMultiTargets(
      fundAddresses,
      VERSION_ABI,
      'accounting',
      [],
      block,
      chain,
      web3,
    );

    newIDs.forEach((id, index) => {
      if (ACCOUNTING_INFO[address]) {
        ACCOUNTING_INFO[address][id] = accountings[index];
      } else {
        ACCOUNTING_INFO[address] = {
          [id]: accountings[index],
        };
      }
    });

    const fundingHoldings = await util.executeCallOfMultiTargets(
      Object.keys(ACCOUNTING_INFO[address]).map(
        (id) => ACCOUNTING_INFO[address][id],
      ),
      VERSION_ABI,
      'getFundHoldings',
      [],
      block,
      chain,
      web3,
    );

    const tokenBalances = [];

    fundingHoldings.forEach((holding) => {
      try {
        const balances = holding.balances.split(',');
        const addresses = holding.addresses.split(',');
        addresses.forEach((token, index) => {
          const balance = BigNumber(balances[index] || 0);
          if (balance.isGreaterThan(0)) {
            tokenBalances.push({
              token: token.toLowerCase(),
              balance,
            });
          }
        });
      } catch {}
    });

    return tokenBalances;
  } catch {
    return null;
  }
}

async function tvl(params: ITvlParams): Promise<any[]> {
  const { block, chain, provider, web3 } = params;
  if (block < 7271059) {
    return [];
  }

  ACCOUNTING_INFO = {};
  try {
    ACCOUNTING_INFO = await basicUtil.readFromCache(
      'accountingInfo.json',
      chain,
      provider,
    );
  } catch {}

  const balanceResults = await Promise.all(
    VERSIONS.map((token) => getTokenBalance(token, block, chain, web3)),
  );

  await basicUtil.saveIntoCache(
    ACCOUNTING_INFO,
    'accountingInfo.json',
    chain,
    provider,
  );

  let balances = [];

  balanceResults.forEach((result) => {
    balances = balances.concat(result);
  });

  return balances;
}

export { tvl };
