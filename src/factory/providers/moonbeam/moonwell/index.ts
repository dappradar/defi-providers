import BigNumber from 'bignumber.js';
import ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

let mtokens = {};
const START_BLOCK = 1284556;
const COMPTROLLER_ADDRESS = '0x8e00d5e02e65a19337cdba98bba9f84d4186a180';
const MGLMR_ADDRESS = '0x091608f4e4a15335145be0A279483C0f8E4c7955';
const STAKING_CONTRACT = '0x8568A675384d761f36eC269D695d6Ce4423cfaB1';
const STAKING_TOKEN = '0x511aB53F793683763E5a8829738301368a2411E3';

async function getMarkets(block, chain, web3) {
  try {
    const contract = new web3.eth.Contract(ABI, COMPTROLLER_ADDRESS);
    const allMarkets = await contract.methods.getAllMarkets().call(null, block);
    const newMTokens = allMarkets.filter(
      (mtoken) => !mtokens[mtoken.toLowerCase()],
    );
    const underlyings = await util.executeCallOfMultiTargets(
      newMTokens,
      ABI,
      'underlying',
      [],
      block,
      chain,
      web3,
    );
    underlyings.forEach((underlying, index) => {
      mtokens[newMTokens[index].toLowerCase()] = (
        underlying || MGLMR_ADDRESS
      ).toLowerCase();
    });
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  try {
    mtokens = await basicUtil.readDataFromFile('pools.json', chain, provider);
  } catch {}

  await getMarkets(block, chain, web3);
  basicUtil.writeDataToFile(mtokens, 'pools.json', chain, provider);

  const mtokenList = Object.keys(mtokens);
  // Get V1 tokens locked
  const results = await util.executeCallOfMultiTargets(
    mtokenList,
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
        token: mtokens[mtokenList[index]],
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

  formatter.sumMultiBalanceOf(
    balances,
    await util.getTokenBalances(
      STAKING_CONTRACT,
      [STAKING_TOKEN],
      block,
      chain,
      web3,
    ),
  );
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
