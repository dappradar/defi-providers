import BigNumber from 'bignumber.js';
import V1_ABI from './v1ABI.json';
import V2_ABI from './v2ABI.json';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const MASSET_DATA = [
  {
    version: 1,
    addr: '0x66126B4aA2a1C07536Ef8E5e8bD4EfDA1FdEA96D',
    start: 10147848,
  },
  {
    version: 2,
    addr: '0x945Facb997494CC2570096c74b5F66A3507330a1',
    start: 11840521,
  },
];

async function getV1(mAsset, block, web3) {
  const contract = new web3.eth.Contract(V1_ABI, mAsset.addr);
  const bAssets = await contract.methods.getBassets().call(null, block);

  const lockedTokens = [];

  bAssets[0].forEach((b) => {
    lockedTokens.push({
      token: b.addr.toLowerCase(),
      balance: new BigNumber(b.vaultBalance),
    });
  });

  return lockedTokens;
}

async function getV2(mAsset, block, web3) {
  const contract = new web3.eth.Contract(V2_ABI, mAsset.addr);
  const bAssets = await contract.methods.getBassets().call(null, block);

  const bAssetPersonal = bAssets.personal;
  const bAssetData = bAssets.data;

  const lockedTokens = [];

  bAssetPersonal.forEach((b, i) => {
    lockedTokens.push({
      token: b.addr.toLowerCase(),
      balance: new BigNumber(bAssetData[i].vaultBalance),
    });
  });

  return lockedTokens;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balanceResults = await Promise.all(
    MASSET_DATA.filter((m) => block > m.start).map((m) =>
      m.version == 1 ? getV1(m, block, web3) : getV2(m, block, web3),
    ),
  );

  const balances = {};

  balanceResults.forEach((results) => {
    formatter.sumMultiBalanceOf(balances, results);
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
