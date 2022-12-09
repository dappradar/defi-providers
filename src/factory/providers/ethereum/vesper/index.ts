import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CONTROLLER = '0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < 11499874) {
    return {};
  }

  const balances = {};
  const collateralToken = {};

  // Get pool list
  const poolAddressList = await util.executeCall(
    CONTROLLER,
    abi,
    'pools',
    [],
    block,
    chain,
    web3,
  );

  const poolLength = await util.executeCall(
    poolAddressList,
    abi,
    'length',
    [],
    block,
    chain,
    web3,
  );

  const idList = Array.from({ length: poolLength }, (v, i) => [i]);

  const poolList = await util.executeMultiCallsOfTarget(
    poolAddressList,
    abi,
    'at',
    idList,
    block,
    chain,
    web3,
  );

  const vesperPoolAddresses = poolList.filter((pool) => pool);

  // Get collateral token, TVL
  const [collateralTokenResults, totalValueResults] = await Promise.all([
    util.executeCallOfMultiTargets(
      vesperPoolAddresses,
      abi,
      'token',
      [],
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      vesperPoolAddresses,
      abi,
      'totalValue',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  collateralTokenResults.forEach((result, index) => {
    if (result) {
      const collateralTokenAddress = result.toLowerCase();
      const poolAddress = vesperPoolAddresses[index];
      collateralToken[poolAddress] = collateralTokenAddress;
      if (!balances.hasOwnProperty(collateralTokenAddress)) {
        balances[collateralTokenAddress] = '0';
      }
    }
  });

  totalValueResults.forEach((result, index) => {
    const balance = BigNumber(result || 0);
    if (balance.isGreaterThan(0)) {
      const balanceAddress =
        collateralToken[vesperPoolAddresses[index]].toLowerCase();
      const existingBalance = new BigNumber(balances[balanceAddress] || '0');
      balances[balanceAddress] = existingBalance.plus(balance).toFixed();
    }
  });

  return { balances };
}
export { tvl };
