import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import DTOKEN_ABI from './abi/dtoken.json';
import ITOKEN_ABI from './abi/itoken.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const LENDING_MARKETS = [
  '0xFc5Bb1E8C29B100Ef8F12773f972477BCab68862', // iADA
  '0x55012aD2f0A50195aEF44f403536DF2465009Ef7', // iATOM
  '0x5511b64Ae77452C7130670C79298DEC978204a47', // iBUSD
  '0x0b66A250Dadf3237DdB38d485082a7BfE400356e', // iBTC
  '0xAD5Ec11426970c32dA48f58c92b1039bC50e5492', // iDAI
  '0xeC3FD540A2dEE6F479bE539D64da593a59e12D08', // iDF
  '0x9ab060ba568B86848bF19577226184db6192725b', // iDOT
  '0x390bf37355e9dF6Ea2e16eEd5686886Da6F47669', // iETH
  '0xD739A569Ec254d6a20eCF029F024816bE58Fb810', // iFIL
  '0xc35ACAeEdB814F42B2214378d8950F8555B2D670', // iGOLDx
  '0xee9099C1318cf960651b3196747640EB84B8806b', // iUNI
  '0xAF9c10b341f55465E8785F0F81DBB52a9Bfe005d', // iUSDC
  '0x0BF8C72d618B5d46b055165e21d661400008fa0F', // iUSDT
];
const YIELD_MARKETS = [
  '0xce14792a280b20c4f8E1ae76805a6dfBe95729f5', // dBUSD
  '0x4E0B5BaFC52D09A8F18eA0b7a6A7dc23A1096f99', // dDAI
  '0x6c0F322442D10269Dd557C6e3A56dCC3a1198524', // dUSDC
  '0x6199cC917C12E4735B4e9cEfbe29E9F0F75Af9E5', // dUSDT
];
let tokens = { iTokens: {}, dTokens: {} };

async function getLendingBalance(address, block, web3) {
  try {
    if (!tokens.iTokens[address]) {
      const contract = new web3.eth.Contract(ITOKEN_ABI, address);
      const token = await contract.methods.underlying().call(null, block);
      tokens.iTokens[address] = token.toLowerCase();
    }
  } catch {}
}

async function getYieldBalance(address, block, web3) {
  try {
    const contract = new web3.eth.Contract(DTOKEN_ABI, address);
    if (!tokens.dTokens[address]) {
      const token = await contract.methods.token().call(null, block);
      tokens.dTokens[address] = token.toLowerCase();
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1508728) {
    return {};
  }

  try {
    tokens = await basicUtil.readFromCache(
      'cache/tokens.json',
      chain,
      provider,
    );
  } catch {}

  if (!tokens.iTokens) {
    tokens.iTokens = {};
  }
  if (!tokens.dTokens) {
    tokens.dTokens = {};
  }

  await Promise.all([
    Promise.all(
      LENDING_MARKETS.map((market) => getLendingBalance(market, block, web3)),
    ),
    Promise.all(
      YIELD_MARKETS.map((market) => getYieldBalance(market, block, web3)),
    ),
  ]);

  await basicUtil.saveIntoCache(tokens, 'cache/tokens.json', chain, provider);

  const results = await Promise.all([
    util.executeCallOfMultiTargets(
      LENDING_MARKETS,
      ITOKEN_ABI,
      'getCash',
      [],
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      YIELD_MARKETS,
      DTOKEN_ABI,
      'getTotalBalance',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  const balanceResults = [];
  LENDING_MARKETS.forEach((address, index) => {
    const balance = BigNumber(results[0][index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: tokens.iTokens[address],
        balance,
      });
    }
  });
  YIELD_MARKETS.forEach((address, index) => {
    const balance = BigNumber(results[1][index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: tokens.dTokens[address],
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
