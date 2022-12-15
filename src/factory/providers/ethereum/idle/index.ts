import BigNumber from 'bignumber.js';
import ABI from './abi.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const contracts = {
  idleDAIYieldV4: {
    underlyingToken: 'DAI',
    address: '0x3fe7940616e5bc47b0775a0dccf6237893353bb4',
  },
  idleDAIYieldV3: {
    underlyingToken: 'DAI',
    address: '0x78751b12da02728f467a44eac40f5cbc16bd7934',
  },
  idleUSDCYieldV4: {
    underlyingToken: 'USDC',
    address: '0x5274891bEC421B39D23760c04A6755eCB444797C',
  },
  idleUSDCYieldV3: {
    underlyingToken: 'USDC',
    address: '0x12B98C621E8754Ae70d0fDbBC73D6208bC3e3cA6',
  },
  idleUSDTYieldV4: {
    underlyingToken: 'USDT',
    address: '0xF34842d05A1c888Ca02769A633DF37177415C2f8',
  },
  idleUSDTYieldV3: {
    underlyingToken: 'USDT',
    address: '0x63D27B3DA94A9E871222CB0A32232674B02D2f2D',
  },
  idleSUSDYieldV4: {
    underlyingToken: 'SUSD',
    address: '0xf52cdcd458bf455aed77751743180ec4a595fd3f',
  },
  idleSUSDYieldV3: {
    underlyingToken: 'SUSD',
    address: '0xe79e177d2a5c7085027d7c64c8f271c81430fc9b',
  },
  idleTUSDYieldV4: {
    underlyingToken: 'TUSD',
    address: '0xc278041fDD8249FE4c1Aad1193876857EEa3D68c',
  },
  idleTUSDYieldV3: {
    underlyingToken: 'TUSD',
    address: '0x51C77689A9c2e8cCBEcD4eC9770a1fA5fA83EeF1',
  },
  idleWBTCYieldV4: {
    underlyingToken: 'WBTC',
    address: '0x8C81121B15197fA0eEaEE1DC75533419DcfD3151',
  },
  idleWBTCYieldV3: {
    underlyingToken: 'WBTC',
    address: '0xD6f279B7ccBCD70F8be439d25B9Df93AEb60eC55',
  },
  idleDAISafeV4: {
    underlyingToken: 'DAI',
    address: '0xa14ea0e11121e6e951e87c66afe460a00bcd6a16',
  },
  idleDAISafeV3: {
    underlyingToken: 'DAI',
    address: '0x1846bdfDB6A0f5c473dEc610144513bd071999fB',
  },
  idleUSDCSafeV4: {
    underlyingToken: 'USDC',
    address: '0x3391bc034f2935ef0e1e41619445f998b2680d35',
  },
  idleUSDCSafeV3: {
    underlyingToken: 'USDC',
    address: '0xcDdB1Bceb7a1979C6caa0229820707429dd3Ec6C',
  },
  idleUSDTSafeV4: {
    underlyingToken: 'USDT',
    address: '0x28fAc5334C9f7262b3A3Fe707e250E01053e07b5',
  },
  idleUSDTSafeV3: {
    underlyingToken: 'USDT',
    address: '0x42740698959761baf1b06baa51efbd88cb1d862b',
  },
};

const underlyingTokens = {
  DAI: {
    decimals: 18,
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  },
  USDC: {
    decimals: 6,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  },
  USDT: {
    decimals: 6,
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  },
  SUSD: {
    decimals: 18,
    address: '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
  },
  TUSD: {
    decimals: 18,
    address: '0x0000000000085d4780b73119b644ae5ecd22b376',
  },
  WBTC: {
    decimals: 8,
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  },
};

const COMPAddr = '0xc00e94cb662c3520282e6f5717214004a7f26888';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11285018) {
    return {};
  }

  const targets = [];
  const methods = [];
  const contractParams = [];
  Object.keys(contracts).forEach((contractName) => {
    const contractInfo = contracts[contractName];
    const underlying = contractInfo.underlyingToken;

    targets.push(contractInfo.address);
    targets.push(COMPAddr);
    targets.push(contractInfo.address);
    targets.push(underlyingTokens[underlying].address);
    methods.push('tokenPrice');
    methods.push('balanceOf');
    methods.push('totalSupply');
    methods.push('balanceOf');
    contractParams.push([]);
    contractParams.push([contractInfo.address]);
    contractParams.push([]);
    contractParams.push([contractInfo.address]);
  });

  const results = await util.executeDifferentCallsOfMultiTargets(
    targets,
    [...ABI, ...ERC20_ABI],
    methods,
    contractParams,
    block,
    chain,
    web3,
  );

  const balanceResults = [];

  Object.keys(contracts).forEach((contractName, index) => {
    const contractInfo = contracts[contractName];
    const underlying = contractInfo.underlyingToken;
    const tokenDecimals = underlyingTokens[underlying].decimals;
    const underlyingTokenAddr = underlyingTokens[underlying].address;

    const tokenPrice = results[index * 4];
    let compBalance = results[index * 4 + 1];
    const totalSupply = results[index * 4 + 2];
    let underlyingTokenBalance = results[index * 4 + 3];

    if (totalSupply && tokenPrice) {
      let tokenTVL = BigNumber(totalSupply)
        .div(1e18)
        .times(BigNumber(tokenPrice).div(`1e${tokenDecimals}`));

      // Get unlent funds
      if (underlyingTokenBalance) {
        underlyingTokenBalance = BigNumber(underlyingTokenBalance);
        if (!underlyingTokenBalance.isNaN() && underlyingTokenBalance.gt(0)) {
          underlyingTokenBalance = underlyingTokenBalance.div(
            `1e${tokenDecimals}`,
          );
          tokenTVL = tokenTVL.plus(underlyingTokenBalance);
        }
      }

      tokenTVL = tokenTVL.times(`1e${tokenDecimals}`);
      balanceResults.push({
        token: underlyingTokenAddr,
        balance: tokenTVL,
      });
    }

    // Get COMP balance
    compBalance = BigNumber(compBalance);
    if (!compBalance.isNaN() && compBalance.gt(0)) {
      balanceResults.push({
        token: COMPAddr,
        balance: compBalance,
      });
    }
  });

  const balances = {};

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
