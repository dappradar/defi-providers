import BigNumber from 'bignumber.js';
import CONTROLLER_ABI from './controllerABI.json';
import TOKEN_ABI from './tokenABI.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import CTOKEN_ABI from '../../../../constants/abi/cToken.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const CONTROLLER_ADDRESS = '0xa4c8d221d8BB851f83aadd0223a8900A6921A349';
const VAULT_ADDRESS = '0x5B67871C3a857dE81A1ca0f9F7945e5670D986Dc';
const DECIMAL_SCALE = BigNumber('10').pow(18);

const TOKENS = [
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
  '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
  '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI
  '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0x39AA39c021dfbaE8faC545936693aC917d5E7563', // cUSDC
  '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
];

const CTOKENS = [
  '0x39AA39c021dfbaE8faC545936693aC917d5E7563', // cUSDC
  '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
];

const START_BLOCK = 10830496;
const EXTERNAL_POSITION = 1;

async function v1_tvl(params) {
  const { block, chain, web3 } = params;
  const balances = {};

  // Vault Asset Balances

  const [balanceOfResults, cTokenConversionRatesMap] = await Promise.all([
    await util.executeCallOfMultiTargets(
      TOKENS,
      ERC20_ABI,
      'balanceOf',
      [VAULT_ADDRESS],
      block,
      chain,
      web3,
    ),
    await util.executeCallOfMultiTargets(
      CTOKENS,
      CTOKEN_ABI,
      'exchangeRateStored',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  const cTokenConversionRates = {};
  CTOKENS.forEach(
    (cToken, index) =>
      (cTokenConversionRates[cToken] =
        cTokenConversionRatesMap[index].toString()),
  );

  // Compute Balances
  balanceOfResults.forEach((balance, index) => {
    if (balance) {
      const address = TOKENS[index];
      const tokenAddress = address.toLowerCase();
      if (!balances[tokenAddress]) {
        balances[tokenAddress] = BigNumber(0);
      }
      balances[tokenAddress] = balances[tokenAddress].plus(
        BigNumber(balance.toString()),
      );
    }
  });

  return balances;
}

async function v2_tvl(params) {
  const { block, chain, web3 } = params;
  const tokenBalances = {};

  if (block <= START_BLOCK) {
    return tokenBalances;
  }

  const setAddresses = await new web3.eth.Contract(
    CONTROLLER_ABI,
    CONTROLLER_ADDRESS,
  ).methods
    .getSets()
    .call(null, block);

  const [supplies, positionsForSets] = await Promise.all([
    await util.executeCallOfMultiTargets(
      setAddresses,
      ERC20_ABI,
      'totalSupply',
      [],
      block,
      chain,
      web3,
    ),
    await util.executeCallOfMultiTargets(
      setAddresses,
      TOKEN_ABI,
      'getPositions',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  const uniswapPositions = {};
  positionsForSets.forEach((positionForSet, i) => {
    const setSupply = BigNumber(supplies[i].toString());
    positionForSet.forEach((pos) => {
      const position = pos.split(',');
      const componentAddress = position[0].toLowerCase();
      const positionUnits = BigNumber(position[2].toString());
      const isExternalPosition = position[3] == EXTERNAL_POSITION;
      if (isExternalPosition) {
        if (!uniswapPositions[componentAddress]) {
          uniswapPositions[componentAddress] = BigNumber(0);
        }
        uniswapPositions[componentAddress] = uniswapPositions[
          componentAddress
        ].plus(positionUnits.times(setSupply));
      } else {
        if (!tokenBalances[componentAddress]) {
          tokenBalances[componentAddress] = BigNumber(0);
        }
        tokenBalances[componentAddress] = tokenBalances[componentAddress].plus(
          positionUnits.times(setSupply).div(DECIMAL_SCALE),
        );
      }
    });
  });

  return await util.convertToUnderlyings(tokenBalances, block, chain, web3);
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const [v1, v2] = await Promise.all([v1_tvl(params), v2_tvl(params)]);

  const tokenAddresses = new Set(Object.keys(v1).concat(Object.keys(v2)));

  const balances = {};

  tokenAddresses.forEach((token) => {
    const v1Balance = new BigNumber(v1[token] || '0');
    const v2Balance = new BigNumber(v2[token] || '0');
    const balance = v1Balance.plus(v2Balance);
    if (balance.isGreaterThan(0)) {
      balances[token] = balance.toFixed();
    }
  });
  return { balances };
}

export { tvl };
