import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';

const FACTORY_ADDRESSES = [
  'KT1FWHLMk5tHbwuSsp31S4Jum4dTVmkXpfJw',
  'KT1PvEyN1xCFCgorN92QCfYjw3axS6jawCiJ',
  'KT1SwH9P1Tx8a58Mm6qBExQFTcy2rwZyZiXS',
  'KT1GDtv3sqhWeSsXLWgcGsmoH5nRRGJd8xVc',
  'KT1Lw8hCoaBrHeTeMXbqHPG4sS4K1xn7yKcD',
  'KT1K7whn5yHucGXMN7ymfKiX5r534QeaJM29',
  'KT1MMLb2FVrrE9Do74J3FH1RNNc4QhDuVCNX',
];

async function getReserve(exchange, block, web3) {
  try {
    const contract = new web3.eth.Contract(null, exchange.address);
    await contract.init();
    const result = await contract.methods.storage().call(null, block);
    const balances = [
      {
        token: exchange.token,
        balance: BigNumber(result.token_pool),
      },
    ];
    try {
      balances.push({
        token: 'xtz',
        balance: BigNumber(result.tez_pool),
      });
    } catch {}
    return balances;
  } catch {}
  return null;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1407404) {
    return {};
  }

  let pools = {};
  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const exchanges = [];
  for (const factory of FACTORY_ADDRESSES) {
    pools[factory] = pools[factory] || [];
    const poolLength = pools[factory].length;

    const contract = new web3.eth.Contract(null, factory);
    await contract.init();

    const counter = await contract.methods.counter().call(null, block);

    if (poolLength < counter) {
      const tokenList = await contract.methods
        .getBigmap('token_list')
        .call(null, block);
      const tokenExchange = await contract.methods
        .getBigmap('token_to_exchange')
        .call(null, block);

      for (let i = poolLength; i < counter; i++) {
        try {
          const token = tokenList.find(
            (list) => list.key == i.toString(),
          ).value;
          const exchange = tokenExchange.find(
            (exchange) =>
              exchange.key.nat == token.nat &&
              exchange.key.address == token.address,
          ).value;
          pools[factory].push({
            token,
            exchange,
          });
        } catch {}
      }
    }

    for (let i = 0; i < counter; i++) {
      try {
        exchanges.push({
          token:
            typeof pools[factory][i].token == 'string'
              ? pools[factory][i].token
              : `${pools[factory][i].token.address}_${pools[factory][i].token.nat}`,
          address: pools[factory][i].exchange,
        });
      } catch {}
    }
  }
  await basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);
  const balances = {};
  const exchangeLength = exchanges.length;
  console.log(`Exchange length: ${exchangeLength}`);

  for (let first = 0; first < exchangeLength; first += 50) {
    const last = Math.min(exchangeLength, first + 50);
    const reserveCalls = [];
    for (let start = first; start < last; start++) {
      reserveCalls.push(getReserve(exchanges[start], block, web3));
    }

    console.log(`Getting reserves from ${first} to ${last}`);

    const results = await Promise.all(reserveCalls);
    results.forEach((result) => {
      formatter.sumMultiBalanceOf(balances, result);
    });

    console.log(`Got reserves from ${first} to ${last}`);
  }
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
