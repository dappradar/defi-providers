import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const LENDING_POOL_ADDRESSES_PROVIDER_REGISTRY =
  '0x3ac4e9aa29940770aeC38fe853a4bbabb2dA9C19';
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
  if (block < 12687211) {
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
    pools = basicUtil.readDataFromFile('./pools.json', chain, provider);
  } catch {}

  await Promise.all(atokens.map((address) => getUnderlyings(address, web3)));
  await basicUtil.writeDataToFile(pools, './pools.json', chain, provider);

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

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
