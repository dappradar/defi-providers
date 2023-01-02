import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const POOLS = [
  '0xcafea35cE5a2fc4CED4464DA4349f81A122fd12b', // current pool
  '0xfd61352232157815cf7b71045557192bf0ce1884',
  '0x7cbe5682be6b648cc1100c76d4f6c96997f753d6',
];
const TOKENS = [
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', // stETH
  '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // SAI
];

async function getETHBalance(pool, block, web3) {
  try {
    const balance = await web3.eth.getBalance(pool, block);
    return {
      token: WETH_ADDRESS,
      balance: BigNumber(balance),
    };
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: getETHBalance of ethereum/nexusmutual`,
      endpoint: 'getETHBalance',
    });
    return null;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 7815747) {
    return {};
  }

  const [balanceResults, ethResults] = await Promise.all([
    util.getTokenBalancesOfEachHolder(POOLS, TOKENS, block, chain, web3),
    Promise.all(POOLS.map((pool) => getETHBalance(pool, block, web3))),
  ]);

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.sumMultiBalanceOf(balances, ethResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
