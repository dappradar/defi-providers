import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import ABI from './abi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

// cache some data
let ctokens = {};
const COMPTROLLER_ADDRESS = '0x7d166777bd19a916c2edf5f1fc1ec138b37e7391';
const WMOVR_ADDRESS = '0x98878b06940ae243284ca214f92bb71a2b032b8a';

async function getMarkets(block, chain, web3) {
  try {
    const contract = new web3.eth.Contract(ABI, COMPTROLLER_ADDRESS);
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
        underlying || WMOVR_ADDRESS
      ).toLowerCase();
    });
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1475516) {
    return {};
  }

  try {
    ctokens = basicUtil.readDataFromFile('pools.json', chain, provider);
  } catch {}

  await getMarkets(block, chain, web3);
  basicUtil.writeDataToFile(ctokens, 'pools.json', chain, provider);
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
    web3,
  );
  return { balances };
}

export { tvl };
