import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import abi from '../../polygon/aave/abi.json';
import BigNumber from 'bignumber.js';

const START_BLOCK = 14597137;
const REGISTERY_V2 = '0x3eAF348Cf1fEC09C0f8d4f52AD3B8D894206b724';

async function balanceOfRegisteredAddress(register, params) {
  const { block, chain, provider, web3 } = params;
  const providerList = await util.executeCall(
    register,
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
      infos.map(
        (info) =>
          info.tokenAddress?.toLowerCase() || info.split(',')[1]?.toLowerCase(),
      ),
    );
  });
  const pools = {};
  await Promise.all(
    atokens.map((address) => getUnderlyings(address, web3, pools)),
  );

  const results = await util.executeMultiCallsOfMultiTargets(
    atokens.map((address) => pools[address]),
    abi,
    'balanceOf',
    atokens.map((address) => [address]),
    block,
    chain,
    web3,
  );

  const balanceResults = {};
  results.forEach((result, index) => {
    const balance = BigNumber(result || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults[pools[atokens[index]]] = balance;
    }
  });
  return balanceResults;
}

async function getUnderlyings(address, web3, pools) {
  try {
    if (!pools[address]) {
      const contract = new web3.eth.Contract(abi, address);
      const underlying = await contract.methods
        .UNDERLYING_ASSET_ADDRESS()
        .call();
      pools[address.toLowerCase()] = underlying.toLowerCase();
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = await balanceOfRegisteredAddress(REGISTERY_V2, params);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}
export { tvl };
