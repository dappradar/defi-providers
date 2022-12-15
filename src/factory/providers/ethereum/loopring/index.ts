import BigNumber from 'bignumber.js';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const OLD_EXCHANGE = '0x944644Ea989Ec64c2Ab9eF341D383cEf586A5777';
const NEW_EXCHANGE = '0x674bdf20A0F284D710BC40872100128e2d66Bd3f';
const TOKENS = [
  '0xbbbbca6a901c926f240b89eacb641d8aec7aeafd', // LRC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 9270795) {
    return {};
  }

  const balances = {};

  let ethBalanceOld = 0;
  let ethBalanceNew = 0;
  try {
    ethBalanceOld = await web3.eth.getBalance(OLD_EXCHANGE, block);
  } catch {}
  try {
    ethBalanceNew = await web3.eth.getBalance(NEW_EXCHANGE, block);
  } catch {}

  const ethBlanaceTotal = BigNumber(ethBalanceOld).plus(ethBalanceNew);
  if (ethBlanaceTotal.isGreaterThan(0)) {
    balances[WETH_ADDRESS] = ethBlanaceTotal.toFixed();
  }

  const results = await util.executeMultiCallsOfMultiTargets(
    [...TOKENS, ...TOKENS],
    ERC20_ABI,
    'balanceOf',
    [
      ...TOKENS.map((token) => [OLD_EXCHANGE]),
      ...TOKENS.map((token) => [NEW_EXCHANGE]),
    ],
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  const tokenLength = TOKENS.length;
  TOKENS.forEach((token, index) => {
    const balance = new BigNumber(results[index] || 0).plus(
      new BigNumber(results[index + tokenLength] || 0),
    );
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token,
        balance,
      });
    }
  });

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
