import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import CHEF_ABI from './abi.json';
import STRAT_ABI from './strat.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const FARM_ADDRESSES = [
  '0x0ac58fd25f334975b1b61732cf79564b6200a933',
  '0xb87f7016585510505478d1d160bdf76c1f41b53d',
];

const REPLACEMENTS = {
  '0xa8bb71facdd46445644c277f9499dd22f6f0a30c':
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', //beltbnb -> wbnb
  '0x9cb73f20164e399958261c289eb5f9846f4d1404':
    '0x55d398326f99059ff775485246999027b3197955', // 4belt -> usdt
  '0x51bd63f240fb13870550423d208452ca87c44444':
    '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', //beltbtc->
  '0xaa20e8cb61299df2357561c2ac2e1172bc68bc25':
    '0x2170ed0880ac9a755fd29b2688956bd959f933f8', //beltETH->
};

const GREEN_MARKETS = {
  '0x24664791b015659fcb71ab2c9c0d56996462082f':
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', //BNB
  '0xf701a48e5c751a213b7c540f84b64b5a6109962e':
    '0xb3cb6d2f8f2fde203a022201c81a96c167607f15', //GAMMA
  '0x928fa017ebf781947102690c9b176996b2e00f22':
    '0xe9e7cea3dedca5984780bafc599bd69add087d56', //BUSD
  '0xb3a4ce0654524dcf4b5165cee280ebe69a6e8133':
    '0x72b7d61e8fc8cf971960dd9cfa59b8c829d91991', //AQUA
  '0xa5ae8459e710f95ca0c93d73f63a66d9996f1ace':
    '0x23396cf899ca06c4472205fc903bdb4de249d6fc', //UST
  '0xcfa5b884689dc09e4503e84f7877d3a583fcceef':
    '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', //BTCB
  '0x66fd9d390de6172691ec0ddf0ac7f231c1f9a434':
    '0x2170ed0880ac9a755fd29b2688956bd959f933f8', //ETH
  '0x854a534cefaf8fd20a70c9dc976c4f65324d7b42':
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', //USDC
  '0x4c2bddc208b58534eddc1fba7b2828cab70797b5':
    '0x55d398326f99059ff775485246999027b3197955', //USDT
  '0x8b2f098411ce4b32c9d2110fef257cf01d006ba5':
    '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3', //DAI
  '0x6022ba7e5a70e1baa98d47a566f3495a26511b25':
    '0x90c97f71e18723b0cf0dfa30ee176ab653e89f40', //FRAX
  '0x84a785e400c43d341d5cbcdc7f0dceb49cae7d00':
    '0x7083609fce4d1d8dc0c979aab8c869ea2c873402', //DOT
  '0x9b81d1df15fd9c07007d9a9b8ff75d40a5a80d94':
    '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47', //ADA
  '0xeb23d803ec8d598662441807456620cf96eb0470':
    '0xcc42724c6683b7e57334c4e856f4c9965ed682bd', //MATIC
  '0x45646b30c3bb8c02bcfe10314308a8055e705ebf':
    '0xfea6ab80cd850c3e63374bc737479aeec0e8b9a1', //SOL
  '0x88fd42e447d39c3259b53623f2536bd855e47c48':
    '0x156ab3346823b651294766e23e6cf87254d68962', //LUNA
  '0x4bdde0904abb1695775cc79c69dd0d61507232e4':
    '0x8b04e56a8cd5f4d465b784ccf564899f30aaf88c', //aUST
  '0x2a29572b771a8d8057a046fe80c45a77dbb6e804':
    '0x1ce0c2827e2ef14d5c4f29a091d735a204794041', //AVAX
  '0x820cde110d5f17b9f985fbb80f10d4f7158f130f':
    '0x0eb3a705fc54725037cc9e008bdede697f62f335', //ATOM
  '0x2acaf66e67876d18cc5a27eb90aa32b06ab4785b':
    '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe', //XRP
};

const STAKING_ADDRESSES = {
  '0x0c6dd143f4b86567d6c21e8ccfd0300f00896442':
    '0xb3cb6d2f8f2fde203a022201c81a96c167607f15', //GAMMA
  '0xb7ed4a5af620b52022fb26035c565277035d4fd7':
    '0x72b7d61e8fc8cf971960dd9cfa59b8c829d91991', //AQUA
  '0x6bd50dfb39699d2135d987734f4984cd59ed6b53':
    '0xb3cb6d2f8f2fde203a022201c81a96c167607f15', //iGamma
  '0x6e7a174836b2df12599ecb2dc64c1f9e1576ac45':
    '0x72b7d61e8fc8cf971960dd9cfa59b8c829d91991', //iAqua
};

const TOTALSUPPLY_METHODS = {
  '0x6bd50dfb39699d2135d987734f4984cd59ed6b53': 'balanceOfGtoken',
  '0x6e7a174836b2df12599ecb2dc64c1f9e1576ac45': 'balanceOfGtoken',
};

const EXCHANGE_RATE_TARGETS = {
  '0x6bd50dfb39699d2135d987734f4984cd59ed6b53':
    '0x0c6dd143f4b86567d6c21e8ccfd0300f00896442',
  '0x6e7a174836b2df12599ecb2dc64c1f9e1576ac45':
    '0xb7ed4a5af620b52022fb26035c565277035d4fd7',
};

let pools = {};

async function getWants(address, contract, id) {
  try {
    if (!pools[id]) {
      const poolInfo = await contract.methods.poolInfo(id).call();
      pools[address][id] = {
        want: poolInfo.want.toLowerCase(),
        strat: poolInfo.strat,
      };
    }
  } catch {}
}

async function getFarmLockedBalances(address, block, chain, web3) {
  const balances = [];

  const contract = new web3.eth.Contract(CHEF_ABI, address);
  let poolLength;
  try {
    poolLength = await contract.methods.poolLength().call(null, block);
  } catch {
    return {};
  }

  const poolIDs = Array.from({ length: poolLength }, (_, i) => i);

  if (!pools[address]) {
    pools[address] = {};
  }

  await Promise.all(poolIDs.map((id) => getWants(address, contract, id)));

  const results = await util.executeCallOfMultiTargets(
    poolIDs.map((id) => pools[address][id].strat),
    STRAT_ABI,
    'wantLockedTotal',
    [],
    block,
    chain,
    web3,
  );

  results.forEach((value, idx) => {
    balances.push({
      token: REPLACEMENTS[pools[address][idx].want] ?? pools[address][idx].want,
      balance: BigNumber(value),
    });
  });

  return { balances };
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 7065203) {
    return {};
  }

  const tokenBalances = {};

  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const results = await Promise.all(
    FARM_ADDRESSES.map((address) =>
      getFarmLockedBalances(address, block, chain, web3),
    ),
  );

  results.forEach((result) =>
    formatter.sumMultiBalanceOf(tokenBalances, result),
  );

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  //Green planet
  let totalSupplies = await util.executeCallOfMultiTargets(
    Object.keys(GREEN_MARKETS),
    CHEF_ABI,
    'totalSupply',
    [],
    block,
    chain,
    web3,
  );
  let storedExchangeRates = await util.executeCallOfMultiTargets(
    Object.keys(GREEN_MARKETS),
    CHEF_ABI,
    'exchangeRateStored',
    [],
    block,
    chain,
    web3,
  );

  const marketBalances = [];
  totalSupplies.forEach((value, idx) => {
    marketBalances.push({
      token: GREEN_MARKETS[Object.keys(GREEN_MARKETS)[idx]],
      balance: BigNumber(value)
        .times(storedExchangeRates[idx])
        .div(idx == 16 ? 1e15 : 1e18),
    });
  });

  //Staking
  const markets = Object.keys(STAKING_ADDRESSES);
  const marketLength = markets.length;
  totalSupplies = await util.executeDifferentCallsOfMultiTargets(
    markets,
    CHEF_ABI,
    markets.map((address) => TOTALSUPPLY_METHODS[address] || 'totalSupply'),
    markets.map((_) => []),
    block,
    chain,
    web3,
  );
  storedExchangeRates = await util.executeCallOfMultiTargets(
    markets.map((address) => EXCHANGE_RATE_TARGETS[address] || address),
    CHEF_ABI,
    'exchangeRateStored',
    [],
    block,
    chain,
    web3,
  );

  for (let i = 0; i < marketLength; i++) {
    marketBalances.push({
      token: STAKING_ADDRESSES[markets[i]],
      balance: BigNumber(totalSupplies[i])
        .times(storedExchangeRates[i])
        .div(1e18),
    });
  }

  formatter.sumMultiBalanceOf(tokenBalances, marketBalances);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  return { balances };
}

export { tvl };
