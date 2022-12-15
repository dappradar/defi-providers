import fetch from 'node-fetch';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import abi from './abi.json';
import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const ERROR = BigNumber(
  '3963877391197344453575983046348115674221700746820753546331534351508065746944',
);

const fTokens = {
  fTUSD: {
    underlying: 'TUSD',
    decimals: 18,
    contract: '0x7674622c63bee7f46e86a4a5a18976693d54441b',
    startBlock: 10997721,
  },
  'fUNI-DAI:WETH': {
    underlying: 'UNI-DAI:WETH',
    decimals: 18,
    contract: '0x307e2752e8b8a9c29005001be66b1c012ca9cdb7',
    startBlock: 11041674,
    type: 'UNI',
  },
  'fUNI-USDC:WETH': {
    underlying: 'UNI-USDC:WETH',
    decimals: 18,
    contract: '0xa79a083fdd87f73c2f983c5551ec974685d6bb36',
    startBlock: 11041667,
    type: 'UNI',
  },
  'fUNI-WETH:USDT': {
    underlying: 'UNI-WETH:USDT',
    decimals: 18,
    contract: '0x7ddc3fff0612e75ea5ddc0d6bd4e268f70362cff',
    startBlock: 11011433,
    type: 'UNI',
  },
  'fUNI-WBTC:WETH': {
    underlying: 'UNI-WBTC:WETH',
    decimals: 18,
    contract: '0x01112a60f427205dca6e229425306923c3cc2073',
    startBlock: 11041683,
    type: 'UNI',
  },
  'fUNI-DPI:WETH': {
    underlying: 'UNI-DPI:WETH',
    decimals: 18,
    contract: '0x2a32dcbb121d48c106f6d94cf2b4714c0b4dfe48',
    startBlock: 11374134,
    type: 'UNI',
  },
  fWETH: {
    underlying: 'WETH',
    decimals: 18,
    contract: '0xfe09e53a81fe2808bc493ea64319109b5baa573e',
    startBlock: 11086824,
  },
  fUSDC: {
    underlying: 'USDC',
    decimals: 6,
    contract: '0xf0358e8c3cd5fa238a29301d0bea3d63a17bedbe',
    startBlock: 11086842,
  },
  fUSDT: {
    underlying: 'USDT',
    decimals: 6,
    contract: '0x053c80ea73dc6941f518a68e2fc52ac45bde7c9c',
    startBlock: 11086849,
  },
  fDAI: {
    underlying: 'DAI',
    decimals: 18,
    contract: '0xab7fa2b2985bccfc13c6d86b1d5a17486ab1e04c',
    startBlock: 11086832,
  },
  fWBTC: {
    underlying: 'WBTC',
    decimals: 8,
    contract: '0x5d9d25c7c457dd82fc8668ffc6b9746b674d4ecb',
    startBlock: 11068089,
  },
  fRENBTC: {
    underlying: 'RENBTC',
    decimals: 8,
    contract: '0xc391d1b08c1403313b0c28d47202dfda015633c4',
    startBlock: 11086855,
  },
  'fCRV-RENWBTC': {
    underlying: 'CRVRENWBTC',
    decimals: 18,
    contract: '0x9aa8f427a17d6b0d91b6262989edc7d45d6aedf8',
    startBlock: 11086865,
  },
  'fCRV-TBTC': {
    underlying: 'CRV-TBTC',
    decimals: 18,
    contract: '0x640704d106e79e105fda424f05467f005418f1b5',
    startBlock: 11230944,
  },
  'fCRV-HBTC': {
    underlying: 'CRV-HBTC',
    decimals: 18,
    contract: '0xcc775989e76ab386e9253df5b0c0b473e22102e2',
    startBlock: 11380817,
  },
  'fCRV-HUSD': {
    underlying: 'CRV-HUSD',
    decimals: 18,
    contract: '0x29780c39164ebbd62e9ddde50c151810070140f2',
    startBlock: 11380823,
  },
  'fCRV-BUSD': {
    underlying: 'CRV-BUSD',
    decimals: 18,
    contract: '0x4b1cbd6f6d8676ace5e412c78b7a59b4a1bbb68a',
    startBlock: 11257802,
    tokenAddress: '0x3b3ac5386837dc563660fb6a0937dfaa5924333b',
    baseTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
  },
  'fCRV-COMP': {
    underlying: 'CRV-COMP',
    decimals: 18,
    contract: '0x998ceb152a42a3eac1f555b1e911642bebf00fad',
    startBlock: 11257781,
    tokenAddress: '0x845838df265dcd2c412a1dc9e959c7d08537f8a2',
    baseTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
  },
  'fCRV-USDN': {
    underlying: 'CRV-USDN',
    decimals: 18,
    contract: '0x683e683fbe6cf9b635539712c999f3b3edcb8664',
    startBlock: 11257784,
    tokenAddress: '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490',
    baseTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
  },
  'fCRV-YPOOL': {
    underlying: 'CRV-YPOOL',
    decimals: 18,
    contract: '0x0fe4283e0216f94f5f9750a7a11ac54d3c9c38f3',
    startBlock: 11152258,
  },
  'fCRV-3POOL': {
    underlying: 'CRV-3POOL',
    decimals: 18,
    contract: '0x71b9ec42bb3cb40f017d8ad8011be8e384a95fa5',
    startBlock: 11159005,
    tokenAddress: '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490',
    baseTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
  },
  'fSUSHI-WBTC:TBTC': {
    underlying: 'SUSHI-WBTC:TBTC',
    decimals: 18,
    contract: '0xf553e1f826f42716cdfe02bde5ee76b2a52fc7eb',
    startBlock: 11036219,
  },
  'fSUSHI-WBTC:WETH': {
    underlying: 'SUSHI-WBTC:WETH',
    decimals: 18,
    contract: '0x5c0a3f55aac52aa320ff5f280e77517cbaf85524',
    startBlock: 11269739,
  },
  'fSUSHI-USDC:WETH': {
    underlying: 'SUSHI-USDC:WETH',
    decimals: 18,
    contract: '0x01bd09a1124960d9be04b638b142df9df942b04a',
    startBlock: 11269722,
  },
  'fSUSHI-WETH:USDT': {
    underlying: 'SUSHI-WETH:USDT',
    decimals: 18,
    contract: '0x64035b583c8c694627a199243e863bb33be60745',
    startBlock: 11269716,
  },
  'fSUSHI-DAI:WETH': {
    underlying: 'SUSHI-DAI:WETH',
    decimals: 18,
    contract: '0x203e97aa6eb65a1a02d9e80083414058303f241e',
    startBlock: 11269733,
  },
  'fUNI-BAC:DAI': {
    underlying: 'UNI-BAC:DAI',
    decimals: 18,
    contract: '0x6bccd7e983e438a56ba2844883a664da87e4c43b',
    startBlock: 11608433,
  },
  'fUNI-DAI:BAS': {
    underlying: 'UNI-DAI:BAS',
    decimals: 18,
    contract: '0xf8b7235fcfd5a75cfdcc0d7bc813817f3dd17858',
    startBlock: 11608445,
  },
  'fSUSHI-MIC:USDT': {
    underlying: 'SUSHI-MIC:USDT',
    decimals: 18,
    contract: '0x6f14165c6d529ea3bfe1814d0998449e9c8d157d',
    startBlock: 11608456,
  },
  'fSUSHI-MIS:USDT': {
    underlying: 'SUSHI-MIS:USDT',
    decimals: 18,
    contract: '0x145f39b3c6e6a885aa6a8fade4ca69d64bab69c8',
    startBlock: 11608466,
  },
  'fCRV-OBTC': {
    underlying: 'CRV-OBTC',
    decimals: 18,
    contract: '0x966a70a4d3719a6de6a94236532a0167d5246c72',
    startBlock: 11639716,
    tokenAddress: '0x8064d9ae6cdf087b1bcd5bdf3531bd5d8c537a68',
    baseTokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  },
};

const uniPools = {
  'UNI-DAI:WETH': {
    contract: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
    startBlock: 10042267,
    token0: '0x6b175474e89094c44da98b954eedeac495271d0f',
    token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  'UNI-USDC:WETH': {
    contract: '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
    startBlock: 10008355,
    token0: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  'UNI-WETH:USDT': {
    contract: '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
    startBlock: 10093341,
    token0: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    token1: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  },
  'UNI-WBTC:WETH': {
    contract: '0xbb2b8038a1640196fbe3e38816f3e67cba72d940',
    startBlock: 10091097,
    token0: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  'UNI-DPI:WETH': {
    contract: '0x4d5ef58aac27d99935e5b6b4a6778ff292059991',
    startBlock: 10836224,
    token0: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b',
    token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  'SUSHI-WBTC:TBTC': {
    contract: '0x2dbc7dd86c6cd87b525bd54ea73ebeebbc307f68',
    startBlock: 10994541,
    token0: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    token1: '0x8daebade922df735c38c80c7ebd708af50815faa',
  },
  'SUSHI-DAI:WETH': {
    contract: '0xc3d03e4f041fd4cd388c549ee2a29a9e5075882f',
    startBlock: 0,
    token0: '0x6b175474e89094c44da98b954eedeac495271d0f',
    token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  'SUSHI-USDC:WETH': {
    contract: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
    startBlock: 0,
    token0: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  'SUSHI-WETH:USDT': {
    contract: '0x06da0fd433c1a5d7a4faa01111c044910a184553',
    startBlock: 0,
    token0: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    token1: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  },
  'SUSHI-WBTC:WETH': {
    contract: '0xceff51756c56ceffca006cd410b03ffc46dd3a58',
    startBlock: 0,
    token0: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  'UNI-BAC:DAI': {
    contract: '0xd4405f0704621dbe9d4dea60e128e0c3b26bddbd',
    startBlock: 0,
    token0: '0x3449fc1cd036255ba1eb19d65ff4ba2b8903a69a',
    token1: '0x6b175474e89094c44da98b954eedeac495271d0f',
  },
  'UNI-DAI:BAS': {
    contract: '0x0379da7a5895d13037b6937b109fa8607a659adf',
    startBlock: 0,
    token0: '0x6b175474e89094c44da98b954eedeac495271d0f',
    token1: '0xa7ed29b253d8b4e3109ce07c80fc570f81b63696',
  },
  'SUSHI-MIC:USDT': {
    contract: '0xc9cb53b48a2f3a9e75982685644c1870f1405ccb',
    startBlock: 0,
    token0: '0x368b3a58b5f49392e5c9e4c998cb0bb966752e51',
    token1: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  },
  'SUSHI-MIS:USDT': {
    contract: '0x066f3a3b7c8fa077c71b9184d862ed0a4d5cf3e0',
    startBlock: 0,
    token0: '0x4b4d2e899658fb59b1d518b68fe836b100ee8958',
    token1: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  },
};

async function getUnderlying(token, block, chain, web3) {
  if (!fTokens[token]) {
    return 0;
  }

  if (block > fTokens[token].startBlock) {
    try {
      let results = await util.executeDifferentCallsOfTarget(
        fTokens[token].contract,
        abi,
        ['totalSupply', 'getPricePerFullShare', 'underlyingUnit'],
        [[], [], []],
        block,
        chain,
        web3,
      );
      results = results.filter((result) => result);
      if (results.length == 0) {
        return 0;
      }

      let ratio = BigNumber(1);
      if (fTokens[token].baseTokenAddress) {
        await fetch(
          `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${fTokens[token].tokenAddress},${fTokens[token].baseTokenAddress}&vs_currencies=usd`,
        )
          .then((resp) => resp.json())
          .then((data) => {
            ratio = BigNumber(
              data[fTokens[token].baseTokenAddress.toLowerCase()].usd,
            ).div(
              BigNumber(data[fTokens[token].tokenAddress.toLowerCase()].usd),
            );
          });
      }

      const fBalance = BigNumber(results[0]).div(ratio);
      const fSharePrice = BigNumber(results[1]);
      const fUnderlyingUnit = BigNumber(results[2]);

      if (!fSharePrice.isNaN() && !fSharePrice.isEqualTo(ERROR)) {
        return fBalance.times(fSharePrice).div(fUnderlyingUnit);
      } else {
        // if shareprice is ERROR, assume shareprice is 1
        return fBalance;
      }
    } catch (error) {
      return 0;
    }
    // if shareprice unavailable, assume shareprice is 0
  }
  return 0;
}

async function getUniswapUnderlying(token, block, chain, web3) {
  if (!fTokens[token]) {
    return [0, 0];
  }

  if (block > fTokens[token].startBlock) {
    const underlyingPool = uniPools[fTokens[token].underlying].contract;
    const address = fTokens[token].contract;

    try {
      let results = await util.executeDifferentCallsOfMultiTargets(
        [address, address, address, underlyingPool, underlyingPool],
        abi,
        [
          'totalSupply',
          'getPricePerFullShare',
          'underlyingUnit',
          'totalSupply',
          'getReserves',
        ],
        [[], [], [], [], []],
        block,
        chain,
        web3,
      );
      results = results.filter((result) => result && result[0]);
      if (results.length === 0) {
        return [0, 0];
      }

      const poolBalance = BigNumber(results[0]);
      const poolSharePrice = BigNumber(results[1]);
      const poolUnderlyingUnit = BigNumber(results[2]);
      const poolUnderlyingBalance = BigNumber(results[3]);
      const poolUnderlyingReservesToken0 = BigNumber(results[4][0]);
      const poolUnderlyingReservesToken1 = BigNumber(results[4][1]);
      if (!poolSharePrice.isNaN() && !poolSharePrice.isEqualTo(ERROR)) {
        const poolFraction = poolBalance
          .times(poolSharePrice)
          .div(poolUnderlyingUnit)
          .div(poolUnderlyingBalance);
        if (!poolFraction.isNaN()) {
          return [
            poolFraction.times(poolUnderlyingReservesToken0),
            poolFraction.times(poolUnderlyingReservesToken1),
          ];
        }
      } else {
        // if shareprice is ERROR, assume shareprice is 1
        const poolFraction = poolBalance.div(poolUnderlyingBalance);
        if (!poolFraction.isNaN()) {
          return [
            poolFraction.times(poolUnderlyingReservesToken0),
            poolFraction.times(poolUnderlyingReservesToken1),
          ];
        }
      }
    } catch (error) {
      return [0, 0];
    } // if shareprice unavailable, assume shareprice is 0
  }
  return [0, 0];
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const promises = [
    getUnderlying('fWETHv0', block, chain, web3), // 0
    getUnderlying('fDAIv0', block, chain, web3),
    getUnderlying('fUSDCv0', block, chain, web3),
    getUnderlying('fUSDTv0', block, chain, web3),
    getUnderlying('fTUSD', block, chain, web3),
    getUnderlying('fWBTCv0', block, chain, web3), // 5
    getUnderlying('fRENBTCv0', block, chain, web3),
    getUnderlying('fCRV-RENWBTCv0', block, chain, web3),
    getUniswapUnderlying('fUNI-DAI:WETHv0', block, chain, web3),
    getUniswapUnderlying('fUNI-USDC:WETHv0', block, chain, web3),
    getUniswapUnderlying('fUNI-WETH:USDTv0', block, chain, web3), // 10
    getUniswapUnderlying('fUNI-WBTC:WETHv0', block, chain, web3),
    getUniswapUnderlying('fUNI-DAI:WETH', block, chain, web3),
    getUniswapUnderlying('fUNI-USDC:WETH', block, chain, web3),
    getUniswapUnderlying('fUNI-WETH:USDT', block, chain, web3),
    getUniswapUnderlying('fUNI-WBTC:WETH', block, chain, web3), // 15
    getUnderlying('fWETH', block, chain, web3),
    getUnderlying('fDAI', block, chain, web3),
    getUnderlying('fUSDC', block, chain, web3),
    getUnderlying('fUSDT', block, chain, web3),
    getUnderlying('fWBTC', block, chain, web3), // 20
    getUnderlying('fRENBTC', block, chain, web3),
    getUnderlying('fCRV-RENWBTC', block, chain, web3),
    getUniswapUnderlying('fSUSHI-WBTC:TBTC', block, chain, web3),
    getUniswapUnderlying('fSUSHI-DAI:WETH', block, chain, web3),
    getUniswapUnderlying('fSUSHI-USDC:WETH', block, chain, web3), // 25
    getUniswapUnderlying('fSUSHI-WETH:USDT', block, chain, web3),
    getUniswapUnderlying('fSUSHI-WBTC:WETH', block, chain, web3),
    getUniswapUnderlying('fUNI-DPI:WETH', block, chain, web3),
    getUnderlying('fCRV-HBTC', block, chain, web3),
    getUnderlying('fCRV-HUSD', block, chain, web3), // 30
    getUnderlying('fCRV-BUSD', block, chain, web3),
    getUnderlying('fCRV-COMP', block, chain, web3),
    getUnderlying('fCRV-USDN', block, chain, web3),
    getUnderlying('fCRV-YPOOL', block, chain, web3),
    getUnderlying('fCRV-3POOL', block, chain, web3), // 35
    getUnderlying('fCRV-TBTC', block, chain, web3),
    getUniswapUnderlying('fUNI-BAC:DAI', block, chain, web3),
    getUniswapUnderlying('fUNI-DAI:BAS', block, chain, web3),
    getUniswapUnderlying('fSUSHI-MIC:USDT', block, chain, web3),
    getUniswapUnderlying('fSUSHI-MIS:USDT', block, chain, web3), // 40
    getUnderlying('fCRV-OBTC', block, chain, web3),
  ];

  const results = await Promise.all(promises);
  const balances = {
    // asset: WETH
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': BigNumber(
      results[0].toString(),
    ) // fWETHv0
      .plus(results[16].toString()) // fWETH
      .plus(results[8][1].toString()) // fUNI-DAI:WETHv0
      .plus(results[9][1].toString()) // fUNI-USDC:WETHv0
      .plus(results[10][0].toString()) // fUNI-WETH:USDTv0
      .plus(results[11][1].toString()) // fUNI-WBTC:WETHv0
      .plus(results[12][1].toString()) // fUNI-DAI:WETH
      .plus(results[13][1].toString()) // fUNI-USDC:WETH
      .plus(results[14][0].toString()) // fUNI-WETH:USDT
      .plus(results[15][1].toString()) // fUNI-WBTC:WETH
      .plus(results[24][1].toString()) // fSUSHI-DAI:WETH
      .plus(results[25][1].toString()) // fSUSHI-USDC:WETH
      .plus(results[26][0].toString()) // fSUSHI-WETH:USDT
      .plus(results[27][1].toString()) // fSUSHI-WBTC:WETH
      .plus(results[28][1].toString()), // fSUSHI-DPI:WETH
    // asset: DAI
    '0x6b175474e89094c44da98b954eedeac495271d0f': BigNumber(
      results[1].toString(),
    ) // fDAIv0
      .plus(results[31].toString()) // fCRV-BUSD
      .plus(results[32].toString()) // fCRV-COMP
      .plus(results[33].toString()) // fCRV-USDN
      .plus(results[35].toString()) // fCRV-COMP
      .plus(results[17].toString()) // fDAI
      .plus(results[8][0].toString()) // fUNI-DAI:WETHv0
      .plus(results[12][0].toString()) // fUNI-DAI:WETH
      .plus(results[24][0].toString()) // fSUSHI-DAI:WETH
      .plus(results[37][1].toString()) // fSUSHI-BAC:DAI
      .plus(results[38][0].toString()), // fSUSHI-DAI:BAS
    // asset: USDC
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': BigNumber(
      results[2].toString(),
    ) // fUSDCv0
      .plus(results[18].toString()) // fUSDC
      .plus(results[9][0].toString()) // fUNI-USDC:WrETH()v0
      .plus(results[13][0].toString()) // fUNI-USDC:WETH
      .plus(results[25][0].toString()), // fSUSHI-USDC:WETH
    // asset: USDT
    '0xdac17f958d2ee523a2206206994597c13d831ec7': BigNumber(
      results[3].toString(),
    ) // fUSDTv0
      .plus(results[19].toString()) // fUSDT
      .plus(results[10][1].toString()) // fUNI-WETH:USDTv0
      .plus(results[14][1].toString()) // fUNI-WETH:USDT
      .plus(results[26][1].toString()) // fSUSHI-WETH:USDT
      .plus(results[39][1].toString()) // fSUSHI-MIC:USDT
      .plus(results[40][1].toString()), // fSUSHI-MIS:USDT
    // asset: TUSD
    '0x0000000000085d4780b73119b644ae5ecd22b376': BigNumber(
      results[4].toString(),
    ), // fTUSD
    // asset: WBTC
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': BigNumber(
      results[5].toString(),
    ) // fWBTCv0
      .plus(results[20].toString()) // fWBTC
      .plus(results[11][0].toString()) // fUNI-WBTC:WETHv0
      .plus(results[15][0].toString()) // fUNI-WBTC:WETH
      .plus(results[23][0].toString()) // fSUSHI-WBTC:TBTC
      .plus(results[27][0].toString()) // fSUSHI-WBTC:WETH
      .plus(BigNumber(results[41].toString()).div(1e10)), // fCRV-OBTC
    // asset: renBTC
    '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d': BigNumber(
      results[6].toString(),
    ) // fRENBTCv0
      .plus(results[21].toString()) // fRENBTC
      .plus(BigNumber(results[7].toString()).div(1e10)) // fCRV-RENWBTCv0, estimate
      .plus(BigNumber(results[22].toString()).div(1e10)), // fCRV-RENWBTC, estimate
    // asset: TBTC
    '0x8daebade922df735c38c80c7ebd708af50815faa': BigNumber(
      results[23][1].toString(),
    ) // fSUSHI-WBTC:TBTC SUSHI
      .plus(BigNumber(results[36].toString())), // fCRV-TBTC, estimate
    // asset: HUSD
    '0xdf574c24545e5ffecb9a659c229253d4111d87e1': BigNumber(
      results[30].toString(),
    ).div(1e10), // fCRV-HUSD, estimate
    // asset: HBTC
    '0x0316eb71485b0ab14103307bf65a021042c6d380': BigNumber(
      results[29].toString(),
    ), // fCRV-HBTC, estimate
    // asset: DPI
    '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b': BigNumber(
      results[28][0].toString(),
    ), // fSUSHI-DPI:WETH
    // asset: CRV-YPOOL
    '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8': BigNumber(
      results[34].toString(),
    ), // fCRV-YPOOL
    // asset: BAC
    '0x3449fc1cd036255ba1eb19d65ff4ba2b8903a69a': BigNumber(
      results[37][0].toString(),
    ), // fSUSHI-BAC:DAI
    // asset: BAS
    '0xa7ed29b253d8b4e3109ce07c80fc570f81b63696': BigNumber(
      results[38][1].toString(),
    ), // fSUSHI-DAI:BAS
    // asset: MIC
    '0x368b3a58b5f49392e5c9e4c998cb0bb966752e51': BigNumber(
      results[39][0].toString(),
    ), // fSUSHI-MIC:USDT
    // asset: MIS
    '0x4b4d2e899658fb59b1d518b68fe836b100ee8958': BigNumber(
      results[40][0].toString(),
    ), // fSUSHI-MIS:USDT

    // TODO don't attribute CRV pools 1:1, factor virtualprice
    // TODO don't attribute all of CRV-HUSD to HUSD
    // TODO don't attribute all of CRV-RENWBTC to renBTC
    // TODO don't attribute all of CRV-TBTC to TBTC
    // TODO don't attribute all of CRV-HBTC to HBTC
    // TODO don't attribute all of CRV-OBTC to OBTC
    // TODO don't attribute all of CRV-USDN to to CRV-3POOL
  };

  for (const key in balances) {
    if (balances[key].isNaN()) {
      delete balances[key];
    } else {
      balances[key] = balances[key].toFixed();
    }
  }
  formatter.convertBalancesToFixed(balances);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return { balances };
}

export { tvl };
