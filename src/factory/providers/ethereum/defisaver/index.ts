import BigNumber from 'bignumber.js';
import {
  AaveSubscriptions,
  AaveLoanInfo,
  CompoundSubscriptions,
  CompoundLoanInfo,
  McdSubscriptions,
  MCDSaverProxy,
  AaveSubscriptionsV2,
  AaveLoanInfoV2,
} from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
const DECIMALS = {
  ETH: 18,
  WETH: 18,
  cETH: 8,
  DAI: 18,
  cDAI: 8,
  iDAI: 18,
  MKR: 18,
  BAT: 18,
  cBAT: 8,
  ZRX: 18,
  KNC: 18,
  cZRX: 8,
  REP: 18,
  REPv2: 18,
  cREP: 8,
  USDC: 6,
  cUSDC: 8,
  WBTC: 8,
  cWBTC: 8,
  DGD: 9,
  USDT: 6,
  cUSDT: 8,
  SAI: 18,
  COMP: 18,
  aETH: 18,
  aDAI: 18,
  aUSDC: 18,
  aSUSD: 18,
  SUSD: 18,
  aTUSD: 18,
  TUSD: 18,
  aUSDT: 18,
  aBUSD: 18,
  BUSD: 18,
  aBAT: 18,
  aKNC: 18,
  aLEND: 18,
  LEND: 18,
  aLINK: 18,
  LINK: 18,
  aMANA: 18,
  MANA: 18,
  aMKR: 18,
  aREP: 18,
  aSNX: 18,
  SNX: 18,
  aWBTC: 18,
  aZRX: 18,
  aENJ: 18,
  ENJ: 18,
  aREN: 18,
  REN: 18,
  CRV: 18,
  YFI: 18,
  aYFI: 18,
  PAXUSD: 18,
  DPI: 18,
  UNI: 18,
  cUNI: 8,
  LRC: 18,
  cCOMP: 8,
  aUNI: 18,
  AAVE: 18,
  aAave: 18,
  BAL: 18,
  GUSD: 2,
  RENBTC: 8,
};

const TOKENS = {
  ETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  cETH: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5',
  DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
  cDAI: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
  iDAI: '0x493c57c4763932315a328269e1adad09653b9081',
  MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
  BAT: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
  cBAT: '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e',
  ZRX: '0xe41d2489571d322189246dafa5ebde1f4699f498',
  cZRX: '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407',
  KNC: '0xdefa4e8a7bcba345f687a2f1456f5edd9ce97202',
  REP: '0x1985365e9f78359a9B6AD760e32412f4a445E862',
  REPv2: '0x221657776846890989a759ba2973e427dff5c9bb',
  cREP: '0x158079ee67fce2f58472a96584a73c7ab9ac95c1',
  USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  cUSDC: '0x39aa39c021dfbae8fac545936693ac917d5e7563',
  WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  cWBTC: '0xccf4429db6322d5c611ee964527d42e5d685dd6a',
  DGD: '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a',
  USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  cUSDT: '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9',
  SAI: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
  COMP: '0xc00e94cb662c3520282e6f5717214004a7f26888',
  aETH: '0x3a3a65aab0dd2a17e3f1947ba16138cd37d08c04',
  aDAI: '0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d',
  aUSDC: '0x9bA00D6856a4eDF4665BcA2C2309936572473B7E',
  aSUSD: '0x625aE63000f46200499120B906716420bd059240',
  SUSD: '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
  aTUSD: '0x4DA9b813057D04BAef4e5800E36083717b4a0341',
  TUSD: '0x0000000000085d4780B73119b644AE5ecd22b376',
  aUSDT: '0x71fc860F7D3A592A4a98740e39dB31d25db65ae8',
  aBUSD: '0x6ee0f7bb50a54ab5253da0667b0dc2ee526c30a8',
  BUSD: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
  aBAT: '0xE1BA0FB44CCb0D11b80F92f4f8Ed94CA3fF51D00',
  aKNC: '0x9D91BE44C06d373a8a226E1f3b146956083803eB',
  aLEND: '0x7D2D3688Df45Ce7C552E19c27e007673da9204B8',
  LEND: '0x80fB784B7eD66730e8b1DBd9820aFD29931aab03',
  aLINK: '0xA64BD6C70Cb9051F6A9ba1F163Fdc07E0DfB5F84',
  LINK: '0x514910771af9ca656af840dff83e8264ecf986ca',
  aMANA: '0x6FCE4A401B6B80ACe52baAefE4421Bd188e76F6f',
  MANA: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
  aMKR: '0x7deB5e830be29F91E298ba5FF1356BB7f8146998',
  aREP: '0x71010A9D003445aC60C4e6A7017c1E89A477B438',
  aSNX: '0x328C4c80BC7aCa0834Db37e6600A6c49E12Da4DE',
  SNX: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  aWBTC: '0xFC4B8ED459e00e5400be803A9BB3954234FD50e3',
  aZRX: '0x6Fb0855c404E09c47C3fBCA25f08d4E41f9F062f',
  aENJ: '0xac6df26a590f08dcc95d5a4705ae8abbc88509ef',
  ENJ: '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c',
  aREN: '0xcc12abe4ff81c9378d670de1b57f8e0dd228d77a',
  REN: '0x408e41876cccdc0f92210600ef50372656052a38',
  CRV: '0xD533a949740bb3306d119CC777fa900bA034cd52',
  YFI: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
  aYFI: '0x12e51E77DAAA58aA0E9247db7510Ea4B46F9bEAd',
  PAXUSD: '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
  DPI: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b',
  UNI: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  cUNI: '0x35A18000230DA775CAc24873d00Ff85BccdeD550',
  LRC: '0xef68e7c694f40c8202821edf525de3782458639f',
  cCOMP: '0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4',
  aUNI: '0xB124541127A0A657f056D9Dd06188c4F1b0e5aab',
  AAVE: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
  aAave: '0xba3D9687Cf50fE253cd2e1cFeEdE1d6787344Ed5',
  BAL: '0xba100000625a3754423978a60c9317c58a424e3d',
  GUSD: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd',
  RENBTC: '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d',
};

function getContract(_contract) {
  const network = 1;
  return {
    abi: _contract.abi,
    createdBlock: _contract.networks[network].createdBlock,
    address: _contract.networks[network].address,
  };
}

const aaveSubs = getContract(AaveSubscriptions);
const aaveLoans = getContract(AaveLoanInfo);
const aaveV2Subs = getContract(AaveSubscriptionsV2);
const aaveV2Loans = getContract(AaveLoanInfoV2);
const compoundSubs = getContract(CompoundSubscriptions);
const compoundLoans = getContract(CompoundLoanInfo);
const mcdSubs = getContract(McdSubscriptions);
const mcdSaverProxy = getContract(MCDSaverProxy);

function initContracts(block, web3) {
  return {
    aaveSubscriptions:
      aaveSubs.createdBlock <= block
        ? new web3.eth.Contract(aaveSubs.abi, aaveSubs.address)
        : null,
    aaveLoanInfo:
      aaveLoans.createdBlock <= block
        ? new web3.eth.Contract(aaveLoans.abi, aaveLoans.address)
        : null,
    aaveV2Subscriptions:
      aaveV2Subs.createdBlock <= block
        ? new web3.eth.Contract(aaveV2Subs.abi, aaveV2Subs.address)
        : null,
    aaveV2LoanInfo:
      aaveV2Loans.createdBlock <= block
        ? new web3.eth.Contract(aaveV2Loans.abi, aaveV2Loans.address)
        : null,
    compoundSubscriptions:
      compoundSubs.createdBlock <= block
        ? new web3.eth.Contract(compoundSubs.abi, compoundSubs.address)
        : null,
    compoundLoanInfo:
      compoundLoans.createdBlock <= block
        ? new web3.eth.Contract(compoundLoans.abi, compoundLoans.address)
        : null,
    mcdSubscriptions:
      mcdSubs.createdBlock <= block
        ? new web3.eth.Contract(mcdSubs.abi, mcdSubs.address)
        : null,
    mcdSaverProxy:
      mcdSaverProxy.createdBlock <= block
        ? new web3.eth.Contract(mcdSaverProxy.abi, mcdSaverProxy.address)
        : null,
  };
}

function bytesToString(hex) {
  return Buffer.from(hex.replace(/^0x/, ''), 'hex')
    .toString()
    .replace(/\x00/g, '');
}

function ilkToAsset(ilk) {
  return (ilk.substr(0, 2) === '0x' ? bytesToString(ilk) : ilk).replace(
    /-.*/,
    '',
  );
}

async function getMakerData(contracts, block, chain, web3) {
  try {
    if (!contracts.mcdSubscriptions || !contracts.mcdSaverProxy) {
      return {};
    }

    const makerSubs = await contracts.mcdSubscriptions.methods
      .getSubscribers()
      .call(null, block);
    const cdpsDetailed = await util.executeMultiCallsOfTarget(
      mcdSaverProxy.address,
      mcdSaverProxy.abi,
      'getCdpDetailedInfo',
      makerSubs.map((cdp) => [cdp.cdpId]),
      block,
      chain,
      web3,
    );

    const balances = {};
    cdpsDetailed.forEach((cdp) => {
      const asset = ilkToAsset(cdp.ilk);
      if (!balances[TOKENS['DAI']]) {
        balances[TOKENS['DAI']] = new BigNumber(0);
      }
      balances[TOKENS['DAI']] = balances[TOKENS['DAI']].plus(
        new BigNumber(cdp.debt),
      );
      if (!balances[TOKENS[asset]]) {
        balances[TOKENS[asset]] = new BigNumber(0);
      }
      balances[TOKENS[asset]] = balances[TOKENS[asset]].plus(
        new BigNumber(cdp.collateral).div(10 ** (18 - DECIMALS[asset])),
      );
    });

    return balances;
  } catch (e) {
    console.log(e.message);
    return {};
  }
}

const getCompoundData = async (contracts, block) => {
  try {
    if (!contracts.compoundSubscriptions || !contracts.compoundLoanInfo) {
      return {};
    }

    const compoundSubs = await contracts.compoundSubscriptions.methods
      .getSubscribers()
      .call(null, block);
    const subData = await contracts.compoundLoanInfo.methods
      .getLoanDataArr(compoundSubs.map((s) => s.user))
      .call(null, block);
    const activeSubs = subData
      .map((sub) => {
        let sumBorrowUsd = new BigNumber(0);
        let sumCollUsd = new BigNumber(0);

        sub.borrowAmounts.forEach((amount, i) => {
          if (sub.borrowAddr[i] === util.ZERO_ADDRESS) {
            return;
          }
          sumBorrowUsd = sumBorrowUsd.plus(new BigNumber(amount));
        });

        sub.collAmounts.forEach((amount, i) => {
          if (sub.collAddr[i] === util.ZERO_ADDRESS) {
            return;
          }
          sumCollUsd = sumCollUsd.plus(new BigNumber(amount));
        });

        return { sumBorrowUsd, sumCollUsd };
      })
      .filter(({ sumBorrowUsd }) => sumBorrowUsd.isGreaterThan(0));

    const balances = {};
    balances[TOKENS['DAI']] = activeSubs.reduce(
      (sum, sub) => sum.plus(sub.sumCollUsd),
      new BigNumber(0),
    );

    return balances;
  } catch (e) {
    console.log(e);
    return {};
  }
};

async function getAaveData(contracts, block) {
  try {
    if (!contracts.aaveSubscriptions || !contracts.aaveLoanInfo) {
      return {};
    }

    const aaveSubs = await contracts.aaveSubscriptions.methods
      .getSubscribers()
      .call(null, block);
    const subData = await contracts.aaveLoanInfo.methods
      .getLoanDataArr(aaveSubs.map((s) => s.user))
      .call(null, block);
    const activeSubs = subData
      .map((sub) => {
        let sumBorrowUsd = new BigNumber(0);
        let sumCollUsd = new BigNumber(0);

        sub.borrowAmounts.forEach((amount, i) => {
          if (sub.borrowAddr[i] === util.ZERO_ADDRESS) {
            return;
          }
          sumBorrowUsd = sumBorrowUsd.plus(new BigNumber(amount));
        });

        sub.collAmounts.forEach((amount, i) => {
          if (sub.collAddr[i] === util.ZERO_ADDRESS) {
            return;
          }
          sumCollUsd = sumCollUsd.plus(new BigNumber(amount));
        });

        return { sumBorrowUsd, sumCollUsd };
      })
      .filter(({ sumBorrowUsd }) => sumBorrowUsd.isGreaterThan(0));

    const balances = {};
    balances[TOKENS['WETH']] = activeSubs.reduce(
      (sum, sub) => sum.plus(sub.sumCollUsd),
      new BigNumber(0),
    );

    return balances;
  } catch (e) {
    console.log(e);
    return {};
  }
}

const getAaveV2Data = async (contracts, block) => {
  try {
    if (!contracts.aaveV2Subscriptions || !contracts.aaveV2LoanInfo) {
      return {};
    }

    const defaultMarket = '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5';
    const aaveSubs = await contracts.aaveV2Subscriptions.methods
      .getSubscribers()
      .call(null, block);
    const subData = await contracts.aaveV2LoanInfo.methods
      .getLoanDataArr(
        defaultMarket,
        aaveSubs.map((s) => s.user),
      )
      .call(null, block);
    const activeSubs = subData
      .map((sub) => {
        let sumBorrowUsd = new BigNumber(0);
        let sumCollUsd = new BigNumber(0);

        sub.borrowStableAmounts.forEach((amount, i) => {
          if (sub.borrowAddr[i] === util.ZERO_ADDRESS) {
            return;
          }
          sumBorrowUsd = sumBorrowUsd.plus(new BigNumber(amount));
        });

        sub.borrowVariableAmounts.forEach((amount, i) => {
          if (sub.borrowAddr[i] === util.ZERO_ADDRESS) {
            return;
          }
          sumBorrowUsd = sumBorrowUsd.plus(new BigNumber(amount));
        });

        sub.collAmounts.forEach((amount, i) => {
          if (sub.collAddr[i] === util.ZERO_ADDRESS) {
            return;
          }
          sumCollUsd = sumCollUsd.plus(new BigNumber(amount));
        });

        return { sumBorrowUsd, sumCollUsd };
      })
      .filter(({ sumBorrowUsd }) => sumBorrowUsd.isGreaterThan(0));

    const balances = {};
    balances[TOKENS['WETH']] = activeSubs.reduce(
      (sum, sub) => sum.plus(sub.sumCollUsd),
      new BigNumber(0),
    );

    return balances;
  } catch (e) {
    console.log(e);
    return {};
  }
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const contracts = initContracts(block, web3);

  const balanceResults = await Promise.all([
    getMakerData(contracts, block, chain, web3),
    getCompoundData(contracts, block),
    getAaveData(contracts, block),
    getAaveV2Data(contracts, block),
  ]);

  const balances = {};
  balanceResults.forEach((result) => {
    for (const token in result) {
      const address = token.toLowerCase();
      if (result[token].isGreaterThan(0)) {
        if (!balances[address]) {
          balances[address] = new BigNumber(0);
        }
        balances[address] = balances[address].plus(result[token]);
      }
    }
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
