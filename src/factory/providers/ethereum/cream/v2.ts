import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const COMPTROLLER = '0xAB1c342C7bf5Ec5F02ADEA1c2270670bCa144CbB';
const y3Crv = '0x9cA85572E6A3EbF24dEDd195623F188735A5179f';
const pool3 = '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490';

async function getAllCTokens(block, chain, web3) {
  return await util.executeCall(
    COMPTROLLER,
    [abi['getAllMarkets']],
    'getAllMarkets',
    [],
    block,
    chain,
    web3,
  );
}

async function getUnderlyingAddresses(block, cTokens, chain, web3) {
  const results = await util.executeCallOfMultiTargets(
    cTokens,
    [abi['underlying']],
    'underlying',
    [],
    block,
    chain,
    web3,
  );
  return cTokens.map((cToken, index) => ({
    token: cToken,
    underlying: results[index],
  }));
}

async function getCashes(block, cTokens, chain, web3) {
  const results = await util.executeCallOfMultiTargets(
    cTokens,
    [abi['getCash']],
    'getCash',
    [],
    block,
    chain,
    web3,
  );
  return cTokens.map((cToken, index) => ({
    token: cToken,
    balance: BigNumber(results[index] || 0),
  }));
}

async function getY3CrvPrice(block, chain, web3) {
  return util.executeCall(
    y3Crv,
    [abi['getPricePerFullShare']],
    'getPricePerFullShare',
    [],
    block,
    chain,
    web3,
  );
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11384868) {
    return {};
  }

  const allCTokens = await getAllCTokens(block, chain, web3);
  const [underlyingAddresses, cashes, y3CrvPrice] = await Promise.all([
    getUnderlyingAddresses(block, allCTokens, chain, web3),
    getCashes(block, allCTokens, chain, web3),
    getY3CrvPrice(block, chain, web3),
  ]);

  const balances = {};
  allCTokens.forEach((cToken) => {
    let getCash = cashes.find(
      (result) => result.token === cToken && result.balance.isGreaterThan(0),
    );
    let underlying = underlyingAddresses.find(
      (result) => result.token === cToken && result.underlying,
    );
    if (getCash && underlying) {
      getCash = getCash.balance;
      underlying = underlying.underlying;
      if (underlying === y3Crv) {
        const pool3Cash = BigNumber(balances[pool3] || 0);
        const y3CrvCash = getCash
          .multipliedBy(y3CrvPrice)
          .div(1e18)
          .integerValue();
        if (!balances[pool3.toLowerCase()]) balances[pool3.toLowerCase()] = '0';
        balances[pool3.toLowerCase()] =
          BigNumber(balances[pool3.toLowerCase()])
            .plus(pool3Cash)
            .plus(y3CrvCash)
            .toFixed() || '0';
        delete balances[underlying];
      } else if (underlying) {
        if (!balances[underlying.toLowerCase()])
          balances[underlying.toLowerCase()] = '0';
        balances[underlying.toLowerCase()] =
          BigNumber(balances[underlying.toLowerCase()])
            .plus(getCash)
            .toFixed() || '0';
      }
    }
  });

  return balances;
}

export { tvl };
