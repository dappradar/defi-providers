import BigNumber from 'bignumber.js';
import FACTORY_ABI from './abi/abi.json';
import PTOKEN_ABI from './abi/ptoken.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

const START_BLOCK = 16085390;
const FACTORY_ADDRESS = '0xFfceAcfD39117030314A07b2C86dA36E51787948';
const WMATIC_ADDRESS = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';
let ptokens = {};

async function getUnderlyings(address, block, web3) {
  try {
    if (!ptokens[address]) {
      const contract = new web3.eth.Contract(PTOKEN_ABI, address);
      try {
        const token = await contract.methods.underlying().call(null, block);
        ptokens[address] = token.toLowerCase();
      } catch {
        ptokens[address] = WMATIC_ADDRESS;
      }
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  try {
    ptokens = basicUtil.readDataFromFile('ptokens.json', chain, provider);
  } catch {}

  const contract = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS);
  const markets = await contract.methods.getAllMarkets().call(null, block);
  await Promise.all(
    markets.map((market) => getUnderlyings(market, block, web3)),
  );

  await basicUtil.writeDataToFile(ptokens, 'ptokens.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    markets,
    PTOKEN_ABI,
    'getCash',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = [];

  markets.forEach((market, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: ptokens[market],
        balance,
      });
    }
  });

  const balances = {};

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
