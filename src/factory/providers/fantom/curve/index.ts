import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import BigNumber from 'bignumber.js';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import abi from './abi.json';

const FACTORY_ADDRESS = '0x686d67265703d1f124c45e33d47d794c566889ba';

const BASE_TOKENS = {
  '0xdbf31df14b66535af65aac99c32e9ea844e14501':
    '0x321162cd933e2be498cd2267a90534a804051b11',
  '0x425ccc1390bed338d98daff91ff0f03738b534ef':
    '0x82f0b8b456c1a451378467398982d4834b6829c1',
  '0xeb9ac3e1c9c3f919804bdc412e0a39b94d4c09d3':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0xd82a4f018ecf6be6e991c3c4a160c9758ec3338f':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0xc931f61b1534eb21d8c11b24f3f5ab2471d4ab50':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0x705bc47eba113be1a66e20824a05a176aa3b5265':
    '0x82f0b8b456c1a451378467398982d4834b6829c1',
  '0x6e48a0c5386211837d99daca233f45ef5aa5f594':
    '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
  '0xf55941e971302c634c586416c43469f3ead5ad3e':
    '0x049d68029688eabf473097a2fc38ef61633a3c7a',
  '0xe2d27f06f63d98b8e11b38b5b08a75d0c8dd62b9':
    '0x846e4d51d7e2043c1a87e0ab7490b93fb940357b',
  '0x0694bf58a4f48c5970454cd4874218eba843cf3e':
    '0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad',
  '0x3129ac70c738d398d1d74c87eab9483fd56d16f8':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0x4a89338a2079a01edbf5027330eac10b615024e5':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee':
    '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
  '0x432d99efb26c22948b0062c9e70f9a8f5b3811db':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0xe3a486c1903ea794eed5d5fa0c9473c7d7708f40':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0x1b6382dbdea11d97f24495c9a90b7c88469134a4':
    '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
  '0xbe54c622c0851cfb4a25b92bb84dee7c6fc16169':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0x425c60cc870a4b4ed7eef9f292b4ee515db8bdcb':
    '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
  '0xe1545b37feab077af9368ca61c19e79e30d60d98':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0x429b741798582ba0d799c9a6458ed98853e92b43':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0xdc9f85ce90d5f378a2b543ed9a51ac1e224ef64e':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0x6a6e93625ac1a40a8ca25a80dbe275474c6ad1e2':
    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
};

const CURVE_POOLS = [
  '0x27E611FD27b276ACbd5Ffd632E5eAEBEC9761E40',
  '0x15bB164F9827De760174d3d3dAD6816eF50dE13c',
  '0x92D5ebF3593a92888C25C0AbEF126583d4b5312E',
  '0xfE1A3dD8b169fB5BF0D5dbFe813d956F39fF6310',
  '0x06e3C4da96fd076b97b7ca3Ae23527314b6140dF',
  '0x3eF6A01A0f81D6046290f3e2A8c5b843e738E604',
  '0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858',
  '0xbC38bD19227F91424eD4132F630f51C9A42Fa338',
  '0x0fa949783947Bf6c1b171DB13AEACBB488845B3f',
  '0xD02a30d33153877BC20e5721ee53DeDEE0422B2F',
  '0xF7b9c402c4D6c2eDbA04a7a515b53D11B1E9b2cc',
  '0x3a1659Ddcf2339Be3aeA159cA010979FB49155FF',
  '0x58e57cA18B7A47112b877E31929798Cd3D703b0f',
  '0x319E268f0A4C85D404734ee7958857F5891506d7',
  '0x4FC8D635c3cB1d0aa123859e2B2587d0FF2707b1',
  '0xDf38ec60c0eC001142a33eAa039e49E9b84E64ED',
  '0xDee85272EAe1aB4afBc6433F4d819BaBC9c7045A',
];

async function getPoolBalance(poolAddress, block, chain, web3) {
  try {
    const poolInfo = {};
    let coins = await util.executeMultiCallsOfTarget(
      poolAddress,
      [abi['coins128']],
      'coins',
      Array.from({ length: 20 }, (v, i) => [i]),
      block,
      chain,
      web3,
    );
    coins = coins.filter((coin) => coin);
    if (coins.length == 0) {
      coins = await util.executeMultiCallsOfTarget(
        poolAddress,
        [abi['coins256']],
        'coins',
        Array.from({ length: 20 }, (v, i) => [i]),
        block,
        chain,
        web3,
      );
      coins = coins.filter((coin) => coin);
    }

    const results = await util.executeCallOfMultiTargets(
      coins,
      ERC20_ABI,
      'balanceOf',
      [poolAddress],
      block,
      chain,
      web3,
    );
    coins.forEach((coin, index) => {
      poolInfo[coin.toLowerCase()] = BigNumber(results[index] || 0);
    });

    return {
      poolAddress,
      poolInfo,
    };
  } catch {
    return null;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 17079116) {
    return {};
  }

  const tokenBalances = {};
  const poolInfo = {};

  const getBalanceCalls = [];
  for (let i = 0; i < CURVE_POOLS.length; i++) {
    getBalanceCalls.push(getPoolBalance(CURVE_POOLS[i], block, chain, web3));
  }

  const balanceResults = await Promise.all(getBalanceCalls);
  for (const result of balanceResults) {
    if (result) {
      poolInfo[result.poolAddress] = result.poolInfo;
    }
  }

  const poolKeys = Object.keys(poolInfo);
  for (let i = 0; i < poolKeys.length; i++) {
    const coinKeys = Object.keys(poolInfo[poolKeys[i]]);

    for (let x = 0; x < coinKeys.length; x++) {
      if (!tokenBalances[coinKeys[x]]) tokenBalances[coinKeys[x]] = 0;

      tokenBalances[coinKeys[x]] = BigNumber(tokenBalances[coinKeys[x]])
        .plus(poolInfo[poolKeys[i]][coinKeys[x]])
        .toFixed();
    }
  }

  //Get Factory Balances
  try {
    const factoryPoolCount = await util.executeCall(
      FACTORY_ADDRESS,
      [abi['pool_count']],
      'pool_count',
      [],
      block,
      chain,
      web3,
    );

    const poolLists = await util.executeMultiCallsOfTarget(
      FACTORY_ADDRESS,
      [abi['pool_list']],
      'pool_list',
      Array.from({ length: factoryPoolCount }, (_, i) => [i]),
      block,
      chain,
      web3,
    );

    const [poolCoins, poolCoinBalances] = await Promise.all([
      util.executeMultiCallsOfTarget(
        FACTORY_ADDRESS,
        [abi['get_coins']],
        'get_coins',
        poolLists.map((address) => [address]),
        block,
        chain,
        web3,
      ),
      util.executeMultiCallsOfTarget(
        FACTORY_ADDRESS,
        [abi['get_balances']],
        'get_balances',
        poolLists.map((address) => [address]),
        block,
        chain,
        web3,
      ),
    ]);

    const coinBalances = [];
    poolLists.forEach((_, index) => {
      poolCoins[index].forEach((coin, i) => {
        coinBalances.push({
          token: coin.toLowerCase(),
          balance: BigNumber(poolCoinBalances[index][i]),
        });
      });
    });

    formatter.sumMultiBalanceOf(tokenBalances, coinBalances, chain, provider);
  } catch {}

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  for (const token in balances) {
    if (BASE_TOKENS[token]) {
      balances[BASE_TOKENS[token]] = BigNumber(
        balances[BASE_TOKENS[token]] || 0,
      )
        .plus(balances[token])
        .toFixed();
      delete balances[token];
    }
  }

  return { balances };
}

export { tvl };
