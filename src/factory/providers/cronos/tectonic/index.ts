import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const WCRO_ADDRESS = '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23';

async function getMarketsForComptroller(
  comptrollerAddress: string,
  cetherAddress: string,
  block,
  chain,
  web3,
) {
  const ctokens = {};
  try {
    const contract = new web3.eth.Contract(ABI, comptrollerAddress);
    const allCTokens = await contract.methods.getAllMarkets().call(null, block);

    const underlyings = await util.executeCallOfMultiTargets(
      allCTokens,
      ABI,
      'underlying',
      [],
      block,
      chain,
      web3,
    );

    underlyings.forEach((underlying, index) => {
      const ctoken = allCTokens[index].toLowerCase();
      // If this is the cether token, use WCRO address, otherwise use the underlying
      if (ctoken === cetherAddress.toLowerCase()) {
        ctokens[ctoken] = WCRO_ADDRESS.toLowerCase();
      } else {
        ctokens[ctoken] = (underlying || WCRO_ADDRESS).toLowerCase();
      }
    });
  } catch (error) {
    // Silent error handling
  }

  return ctokens;
}

async function getTvlForComptroller(
  comptrollerAddress: string,
  cetherAddress: string,
  params: ITvlParams,
) {
  const { block, chain, provider, web3 } = params;

  const cacheKey = `cache/pools_${comptrollerAddress.toLowerCase()}.json`;
  let ctokens = {};

  try {
    ctokens = await basicUtil.readFromCache(cacheKey, chain, provider);
  } catch {}

  const newCtokens = await getMarketsForComptroller(
    comptrollerAddress,
    cetherAddress,
    block,
    chain,
    web3,
  );
  Object.assign(ctokens, newCtokens);

  await basicUtil.saveIntoCache(ctokens, cacheKey, chain, provider);

  const ctokenList = Object.keys(ctokens);
  if (ctokenList.length === 0) {
    return {};
  }

  const results = await util.executeCallOfMultiTargets(
    ctokenList,
    ABI,
    'getCash',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  results.forEach((result, index) => {
    if (result) {
      balanceResults.push({
        token: ctokens[ctokenList[index]],
        balance: BigNumber(result),
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults, chain, provider);

  return tokenBalances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block } = params;

  if (block < 2100000) {
    return {};
  }

  // Define the three comptroller/cether pairs
  const comptrollers = [
    {
      comptroller: '0xb3831584acb95ed9ccb0c11f677b5ad01deaeec0',
      cether: '0xeadf7c01da7e93fdb5f16b0aa9ee85f978e89e95',
    },
    {
      comptroller: '0x8312A8d5d1deC499D00eb28e1a2723b13aA53C1e',
      cether: '0xf4ff4b8ee660d4276eda17e79094a7cc519e9606',
    },
    {
      comptroller: '0x7E0067CEf1e7558daFbaB3B1F8F6Fa75Ff64725f',
      cether: '0x972173afb7eefb80a0815831b318a643442ad0c1',
    },
  ];

  // Get TVL for each comptroller
  const tvlPromises = comptrollers.map(({ comptroller, cether }) =>
    getTvlForComptroller(comptroller, cether, params),
  );

  const tvlResults = await Promise.all(tvlPromises);

  // Merge all results
  const mergedBalances = {};
  tvlResults.forEach((tokenBalances) => {
    Object.entries(tokenBalances).forEach(([token, balance]) => {
      if (!mergedBalances[token]) {
        mergedBalances[token] = new BigNumber(0);
      }
      mergedBalances[token] = mergedBalances[token].plus(balance);
    });
  });

  const balances = await util.convertToUnderlyings(
    mergedBalances,
    block,
    params.chain,
    params.provider,
    params.web3,
  );

  return { balances };
}

export { tvl };
