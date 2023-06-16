import BigNumber from 'bignumber.js';
import FACTORY_ABI from './abi/abi.json';
import STABILIZER_ABI from './abi/stabilizer.json';
import ANTOKEN_ABI from './abi/antoken.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

const FACTORY_ADDRESS = '0x4dcf7407ae5c07f8681e1659f626e114a7667339';
const STABILIZER_ADDRESS = '0x7eC0D931AFFBa01b77711C2cD07c76B970795CDd';
const VAULTS = [
  '0x89eC5dF87a5186A0F0fa8Cb84EdD815de6047357', // inUSDC->ETH
  '0xc8f2E91dC9d198edEd1b2778F6f2a7fd5bBeac34', // inDAI->WBTC
  '0x41D079ce7282d49bf4888C71B5D9E4A02c371F9B', // inDAI->YFI
  '0x2dCdCA085af2E258654e47204e483127E0D8b277', // inDAI->ETH
];
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
let antokens = {};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11915867) {
    return {};
  }

  const tokenBalances = {};

  try {
    const stabilizerContract = new web3.eth.Contract(
      STABILIZER_ABI,
      STABILIZER_ADDRESS,
    );
    tokenBalances[DAI_ADDRESS] = await stabilizerContract.methods
      .supply()
      .call(null, block);
  } catch {}

  try {
    antokens = await basicUtil.readDataFromFile(
      'cache/pools.json',
      chain,
      provider,
    );
  } catch {}

  const contract = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS);
  const markets = await contract.methods.getAllMarkets().call(null, block);
  const allMarkets = markets.concat(VAULTS);
  const newMarkets = allMarkets.filter((market) => !antokens[market]);

  const [results, underlyings] = await Promise.all([
    util.executeDifferentCallsOfMultiTargets(
      [...allMarkets, ...allMarkets],
      ANTOKEN_ABI,
      [
        ...allMarkets.map((market) => 'getCash'),
        ...allMarkets.map((market) => 'totalSupply'),
      ],
      [...allMarkets.map((market) => []), ...allMarkets.map((market) => [])],
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      newMarkets,
      ANTOKEN_ABI,
      'underlying',
      [],
      block,
      chain,
      web3,
    ),
  ]);
  newMarkets.forEach((market, index) => {
    antokens[market] = underlyings[index] || WETH_ADDRESS;
  });
  basicUtil.writeDataToFile(antokens, 'cache/pools.json', chain, provider);

  const marketLength = allMarkets.length;
  const balanceResults = allMarkets.map((market, index) => ({
    token: antokens[market],
    balance: new BigNumber(
      results[index] || results[index + marketLength] || 0,
    ),
  }));

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
