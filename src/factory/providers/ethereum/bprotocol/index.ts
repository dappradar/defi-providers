import BigNumber from 'bignumber.js';
import UNITROLLER_ABI from './abi/abi.json';
import REGISTRY_ABI from './abi/registry.json';
import CTOKEN_ABI from './abi/ctoken.json';
import BTVL_ABI from './abi/btvl.json';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const UNITROLLER_ADDRESS = '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B';
const REGISTRY_ADDRESS = '0xbf698df5591caf546a7e087f5806e216afed666a';
const BTVL_ADDRESS = '0x60312e01A2ACd1Dac68838C949c1D20C609B20CF';
const BCDP_MANAGER = '0x3f30c2381CD8B917Dd96EB2f1A4F96D91324BBed';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const ETH_ILK =
  '0x4554482d41000000000000000000000000000000000000000000000000000000';
let ctokens = {};
const cTokenRatio = {};

/*==================================================
  Helper
  ==================================================*/

async function getBalance(address, block, chain, web3) {
  try {
    const balanceResults = await util.getTokenBalances(
      address,
      Object.keys(ctokens),
      block,
      chain,
      web3,
    );
    const tokenBalances = {};
    formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

    const balances = [];
    for (const token in tokenBalances) {
      try {
        balances.push({
          token: ctokens[token],
          balance: tokenBalances[token].times(cTokenRatio[token]),
        });
      } catch {}
    }
    return { balances };
  } catch {
    return [];
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 11257605) {
    return {};
  }

  try {
    ctokens = await basicUtil.readFromCache(
      'cache/pools.json',
      chain,
      provider,
    );
  } catch {}

  let avatarList = [];
  try {
    const registryContract = new web3.eth.Contract(
      REGISTRY_ABI,
      REGISTRY_ADDRESS,
    );
    avatarList = await registryContract.methods.avatarList().call(null, block);
  } catch {}

  const contract = new web3.eth.Contract(UNITROLLER_ABI, UNITROLLER_ADDRESS);
  const markets = await contract.methods.getAllMarkets().call(null, block);

  const newMarkets = markets.filter((market) => !ctokens[market.toLowerCase()]);
  const underlyingResults = await util.executeCallOfMultiTargets(
    newMarkets,
    CTOKEN_ABI,
    'underlying',
    [],
    block,
    chain,
    web3,
  );

  underlyingResults.forEach((result, index) => {
    if (result) {
      ctokens[newMarkets[index].toLowerCase()] = result.toLowerCase();
    }
  });

  const [cashResults, totalSupplyResults] = await Promise.all([
    util.executeCallOfMultiTargets(
      markets,
      CTOKEN_ABI,
      'getCash',
      [],
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      markets,
      CTOKEN_ABI,
      'totalSupply',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  cashResults.forEach((result, index) => {
    try {
      cTokenRatio[markets[index].toLowerCase()] = BigNumber(result).div(
        BigNumber(totalSupplyResults[index]),
      );
    } catch {}
  });

  basicUtil.savedIntoCache(ctokens, 'cache/pools.json', chain, provider);

  const balances = {};
  if (block < 12949381) {
    const balanceResults = await Promise.all(
      avatarList.map((avatar) => getBalance(avatar, block, chain, web3)),
    );

    balanceResults.forEach((result) => {
      formatter.sumMultiBalanceOf(balances, result);
    });
  } else {
    let fullAvatarList = [];
    let fullCTokenList = [];
    const ctokenList = Object.keys(ctokens);

    avatarList.forEach((avatar) => {
      fullAvatarList = fullAvatarList.concat(
        ctokenList.map((ctoken) => [avatar]),
      );
      fullCTokenList = fullCTokenList.concat(ctokenList);
    });

    const results = await util.executeMultiCallsOfMultiTargets(
      fullCTokenList,
      CTOKEN_ABI,
      'balanceOf',
      fullAvatarList,
      block,
      chain,
      web3,
    );

    const balanceResults = [];
    results.forEach((result, index) => {
      if (result) {
        balanceResults.push({
          token: fullCTokenList[index],
          balance: BigNumber(result),
        });
      }
    });

    formatter.sumMultiBalanceOf(balances, balanceResults);
  }

  try {
    const btvlContract = new web3.eth.Contract(BTVL_ABI, BTVL_ADDRESS);
    let cdpi = await btvlContract.methods.cdpi(BCDP_MANAGER).call(null, block);
    cdpi = Number(cdpi) + 1;
    const results = await util.executeMultiCallsOfTarget(
      BTVL_ADDRESS,
      BTVL_ABI,
      'cdpTvl',
      Array.from({ length: cdpi }, (v, i) => [BCDP_MANAGER, i, ETH_ILK]),
      block,
      chain,
      web3,
    );

    results.forEach((result) => {
      if (result) {
        if (!balances[WETH_ADDRESS]) {
          balances[WETH_ADDRESS] = BigNumber(0);
        }
        balances[WETH_ADDRESS] = balances[WETH_ADDRESS].plus(result);
      }
    });
  } catch {}

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
