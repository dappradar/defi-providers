import ABI from './abi.json';
import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

// cache some data
let mtokens = {};
const COMPTROLLER_ADDRESS = '0x8529ea4DBDcA738aA928d682ea9c1382Bf2Ff098';
const MTOKENS = [
  '0x6a1A771C7826596652daDC9145fEAaE62b1cd07f',
  '0x6503D905338e2ebB550c9eC39Ced525b612E77aE',
  '0xd0670AEe3698F66e2D4dAf071EB9c690d978BFA8',
  '0x36918B66F9A3eC7a59d0007D8458DB17bDffBF21',
  '0x93Ef8B7c6171BaB1C0A51092B2c9da8dc2ba0e9D',
  '0x6E745367F4Ad2b3da7339aee65dC85d416614D90',
];
const WMOVR_ADDRESS = '0x98878b06940ae243284ca214f92bb71a2b032b8a';

async function getMarkets(block, chain, web3) {
  try {
    const contract = new web3.eth.Contract(ABI, COMPTROLLER_ADDRESS);
    const allMarkets = await contract.methods.getAllMarkets().call(null, block);
    const allMTokens = MTOKENS.concat(allMarkets || []);
    const newMTokens = allMTokens.filter(
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
        underlying || WMOVR_ADDRESS
      ).toLowerCase();
    });
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1461990) {
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
  return { balances };
}

export { tvl };
