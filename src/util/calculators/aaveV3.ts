import util from '../blockchainUtil';
import formatter from '../formatter';
import POOL_DATA_PROVIDER_V3_ABI from '../../constants/abi/poolDataProviderV3Abi.json';
import AAVE_ERC20_ABI from '../../constants/abi/aaveErc20Abi.json';
import Web3 from 'web3';
import { IBalances } from '../../interfaces/ITvl';

async function getAddresses(poolDataProviderV3, block, chain, web3) {
  const aaveTokenMarketData = await util.executeCall(
    poolDataProviderV3,
    POOL_DATA_PROVIDER_V3_ABI,
    'getAllATokens',
    [],
    block,
    chain,
    web3,
  );

  const aaveTokenAddresses = [];
  aaveTokenMarketData.map((aaveTokensData) => {
    if (aaveTokensData) {
      aaveTokenAddresses.push(
        typeof aaveTokensData == 'string'
          ? aaveTokensData.substring(aaveTokensData.indexOf(',') + 1)
          : aaveTokensData.tokenAddress,
      );
    }
  });

  const underlyingAddressesData = await util.executeCallOfMultiTargets(
    aaveTokenAddresses,
    AAVE_ERC20_ABI,
    'UNDERLYING_ASSET_ADDRESS',
    [],
    block,
    chain,
    web3,
  );

  const reserveTokenAddresses = underlyingAddressesData.map(
    (reserveData) => reserveData,
  );

  return [aaveTokenAddresses, reserveTokenAddresses];
}

async function getTvl(
  poolDataProvider: string,
  block: number,
  chain: string,
  web3: Web3,
): Promise<IBalances> {
  const balances = {};

  const [aaveTokens, reserveTokens] = await getAddresses(
    poolDataProvider,
    block,
    chain,
    web3,
  );

  const balanceResults = await util.getTokenBalancesOfHolders(
    aaveTokens,
    reserveTokens,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceResults);
  return balances;
}

export default { getTvl };
