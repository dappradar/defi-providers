import BigNumber from 'bignumber.js';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const HTOKENS = {
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599':
    '0x0316eb71485b0ab14103307bf65a021042c6d380',
  '0xaac679720204aaa68b6c5000aa87d789a3ca0aa5':
    '0xaac679720204aaa68b6c5000aa87d789a3ca0aa5',
  '0x9ffc3bcde7b68c46a6dc34f0718009925c1867cb':
    '0x9ffc3bcde7b68c46a6dc34f0718009925c1867cb',
  '0x9afb950948c2370975fb91a441f36fdc02737cd4':
    '0x9afb950948c2370975fb91a441f36fdc02737cd4',
  '0x14007c545e6664c8370f27fa6b99dc830e6510a6':
    '0x14007c545e6664c8370f27fa6b99dc830e6510a6',
  '0x2c000c0093de75a8fa2fccd3d97b314e20b431c3':
    '0x2c000c0093de75a8fa2fccd3d97b314e20b431c3',
  '0xf45b14ddabf0f0e275e215b94dd24ae013a27f12':
    '0x4a10307e221781570e4b7e409eb315f11e8d0385',
};

const DECIMAL_OFFSET = {
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 10,
  '0xaac679720204aaa68b6c5000aa87d789a3ca0aa5': 0,
  '0x9ffc3bcde7b68c46a6dc34f0718009925c1867cb': 0,
  '0x9afb950948c2370975fb91a441f36fdc02737cd4': 0,
  '0x14007c545e6664c8370f27fa6b99dc830e6510a6': 0,
  '0x2c000c0093de75a8fa2fccd3d97b314e20b431c3': 0,
  '0xf45b14ddabf0f0e275e215b94dd24ae013a27f12': 0,
};

async function getTokenBalance(pool, token, block, web3) {
  try {
    const contract = new web3.eth.Contract(ERC20_ABI, pool);
    const balance = await contract.methods.totalSupply().call(null, block);
    return {
      token: token,
      balance: new BigNumber(balance),
    };
  } catch {
    return null;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 9076087) {
    return {};
  }

  const results = await util.executeCallOfMultiTargets(
    Object.keys(HTOKENS).map((token) => HTOKENS[token]),
    ERC20_ABI,
    'totalSupply',
    [],
    block,
    chain,
    web3,
  );

  const balances = {};
  Object.keys(HTOKENS).forEach((token, index) => {
    const balance = new BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balances[token] = balance.div(10 ** DECIMAL_OFFSET[token]).toFixed();
    }
  });
  return { balances };
}

export { tvl };
