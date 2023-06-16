import BigNumber from 'bignumber.js';
import ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

// cache some data
let ctokens = {};
const UNITROLLER_ADDRESS = '0x20CA53E2395FA571798623F1cFBD11Fe2C114c24';
const WMATIC_ADDRESS = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';

async function getMarkets(block, chain, web3) {
  try {
    const contract = new web3.eth.Contract(ABI, UNITROLLER_ADDRESS);
    const allCTokens = await contract.methods.getAllMarkets().call(null, block);
    const newCTokens = allCTokens.filter(
      (ctoken) => !ctokens[ctoken.toLowerCase()],
    );
    const underlyings = await util.executeCallOfMultiTargets(
      newCTokens,
      ABI,
      'underlying',
      [],
      block,
      chain,
      web3,
    );
    underlyings.forEach((underlying, index) => {
      ctokens[newCTokens[index].toLowerCase()] = (
        underlying || WMATIC_ADDRESS
      ).toLowerCase();
    });
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 15815574) {
    return {};
  }

  try {
    ctokens = await basicUtil.readDataFromFile('pools.json', chain, provider);
  } catch {}

  await getMarkets(block, chain, web3);
  await basicUtil.writeDataToFile(ctokens, 'pools.json', chain, provider);

  const ctokenList = Object.keys(ctokens);
  // Get V1 tokens locked
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

  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );
  return { balances };
}

export { tvl };
