import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import formatter from '../../../../util/formatter';
import abi from '../../polygon/aave/abi.json';
import BigNumber from 'bignumber.js';

const START_BLOCK = 11700000;
const STAKING_CONTRACT = '0xc2054A8C33bfce28De8aF4aF548C48915c455c13';
const RADIANT = '0x0C4681e6C0235179ec3D4F4fc4DF3d14FDD96017';
const REGISTERY = '0x7BB843f889e3a0B307299c3B65e089bFfe9c0bE0';
const REGISTERY_V2 = '0x9D36DCe6c66E3c206526f5D7B3308fFF16c1aa5E';

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
  const stakedBalance = {};
  stakedBalance[RADIANT.toLowerCase()] = (
    await util.getTokenBalances(STAKING_CONTRACT, [RADIANT], block, chain, web3)
  )[0].balance;
  const [registeredAddress, registeredAddressV2] = await Promise.all([
    balanceOfRegisteredAddress(REGISTERY, params),
    balanceOfRegisteredAddress(REGISTERY_V2, params),
  ]);

  const balances = formatter.sum([
    stakedBalance,
    registeredAddress,
    registeredAddressV2,
  ]);
  return { balances };
}
export { tvl };
