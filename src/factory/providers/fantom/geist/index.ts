import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import abi from './abi.json';

const LENDING_POOL_ADDRESSES_PROVIDER_REGISTRY =
  '0x4CF8E50A5ac16731FA2D8D9591E195A285eCaA82';
let pools = {};

async function getUnderlyings(address, web3) {
  try {
    if (!pools[address]) {
      const contract = new web3.eth.Contract(abi, address);
      const underlying = await contract.methods
        .UNDERLYING_ASSET_ADDRESS()
        .call();
      pools[address] = underlying.toLowerCase();
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 18399357) {
    return {};
  }

  const providerList = await util.executeCall(
    LENDING_POOL_ADDRESSES_PROVIDER_REGISTRY,
    abi,
    'getAddressesProvidersList',
    [],
    block,
    chain,
    web3,
  );
  const helpers = await util.executeCallOfMultiTargets(
    providerList,
    abi,
    'getAddress',
    ['0x0100000000000000000000000000000000000000000000000000000000000000'],
    block,
    chain,
    web3,
  );
  const atokensInfos = await util.executeCallOfMultiTargets(
    helpers,
    abi,
    'getAllATokens',
    [],
    block,
    chain,
    web3,
  );
  let atokens = [];

  atokensInfos.forEach((infos) => {
    atokens = atokens.concat(
      infos.map((info) => info.tokenAddress || info.split(',')[1]),
    );
  });

  try {
    pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {}

  await Promise.all(atokens.map((address) => getUnderlyings(address, web3)));

  basicUtil.savedIntoCache(pools, 'cache/pools.json', chain, provider);

  const results = await util.executeMultiCallsOfMultiTargets(
    atokens.map((address) => pools[address]),
    abi,
    'balanceOf',
    atokens.map((address) => [address]),
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  results.forEach((result, index) => {
    const balance = BigNumber(result || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: pools[atokens[index]],
        balance,
      });
    }
  });

  const balances = {};

  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
