import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import FACTORY_ABI from './abi/abi.json';
import PTOKEN_ABI from './abi/ptoken.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const FACTORY_ADDRESS = '0x8c925623708A94c7DE98a8e83e8200259fF716E0';
const WBNB_ADDRESS = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
let ptokens = {};

async function getUnderlyings(address, block, web3) {
  try {
    if (!ptokens[address]) {
      const contract = new web3.eth.Contract(PTOKEN_ABI, address);
      try {
        const token = await contract.methods.underlying().call(null, block);
        ptokens[address] = token.toLowerCase();
      } catch {
        ptokens[address] = WBNB_ADDRESS;
      }
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 7533432) {
    return {};
  }

  try {
    ptokens = basicUtil.readDataFromFile('cache/ptokens.json', chain, provider);
  } catch {}

  const contract = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS);
  const markets = await contract.methods.getAllMarkets().call(null, block);
  await Promise.all(
    markets.map((market) => getUnderlyings(market, block, web3)),
  );

  basicUtil.writeDataToFile(ptokens, 'cache/ptokens.json', chain, provider);

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
  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
