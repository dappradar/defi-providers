import BigNumber from 'bignumber.js';
import abi from './abi.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import { channel } from 'diagnostics_channel';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

// cache some data
let ctokens = {
  '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e':
    '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
  '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643':
    '0x6b175474e89094c44da98b954eedeac495271d0f',
  '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5':
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  '0x158079ee67fce2f58472a96584a73c7ab9ac95c1':
    '0x1985365e9f78359a9b6ad760e32412f4a445e862',
  '0x39aa39c021dfbae8fac545936693ac917d5e7563':
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9':
    '0xdac17f958d2ee523a2206206994597c13d831ec7',
  '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4':
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407':
    '0xe41d2489571d322189246dafa5ebde1f4699f498',
  '0xf5dce57282a584d2746faf1593d3121fcac444dc':
    '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
};
const UNITROLLER_ADDRESS = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b';
const MONEY_MARKET_ADDRESS = '0x3FDA67f7583380E67ef93072294a7fAc882FD7E7';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

async function getMarkets(block, chain, web3) {
  try {
    const contract = new web3.eth.Contract(abi, UNITROLLER_ADDRESS);
    const allCTokens = await contract.methods.getAllMarkets().call(null, block);
    const newCTokens = allCTokens.filter(
      (ctoken) => !ctokens[ctoken.toLowerCase()],
    );
    const underlyings = await util.executeCallOfMultiTargets(
      newCTokens,
      abi,
      'underlying',
      [],
      block,
      chain,
      web3,
    );
    underlyings.forEach((underlying, index) => {
      ctokens[newCTokens[index].toLowerCase()] = (
        underlying || WETH_ADDRESS
      ).toLowerCase();
    });
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  try {
    ctokens = await basicUtil.readDataFromFile('pools.json', chain, provider);
  } catch {}

  await getMarkets(block, chain, web3);

  basicUtil.writeDataToFile(ctokens, 'pools.json', chain, provider);

  const ctokenList = Object.keys(ctokens);
  // Get V1 tokens locked
  const [balanceResults, results] = await Promise.all([
    util.getTokenBalances(
      MONEY_MARKET_ADDRESS,
      ctokenList.map((market) => ctokens[market]),
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      ctokenList,
      abi,
      'getCash',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  results.forEach((result, index) => {
    if (result) {
      balanceResults.push({
        token: ctokens[ctokenList[index]],
        balance: BigNumber(result),
      });
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
