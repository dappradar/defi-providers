import basicUtil from '../../../../util/basicUtil';
import POOL_ABI from './abi.json';
import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_ADDRESSES = [
  '0xCADc8CB26c8C7cB46500E61171b5F27e9bd7889D',
  '0xc80eA568010Bca1Ad659d1937E17834972d66e0D',
  '0xEDfcB78e73f7bA6aD2D829bf5D462a0924da28eD',
  '0x7eaaEaF2aB59C2c85a17BEB15B110F81b192e98a',
  '0x0137d886e832842a3B11c568d5992Ae73f7A792e',
  '0xE02BCFa3D0072AD2F52eD917a7b125e257c26032',
  '0x1b6e3d394f1D809769407DEA84711cF57e507B99',
  '0xC1aAE51746bEA1a1Ec6f17A4f75b422F8a656ee6',
  '0xa59EFEf41040e258191a4096DC202583765a43E7',
  '0xC0314BbE19D4D5b048D3A3B974f0cA1B2cEE5eF3',
  '0x3f139386406b0924eF115BAFF71D0d30CC090Bd5',
  '0xCBd4472cbeB7229278F841b2a81F1c0DF1AD0058',
  '0x41dF17D1De8D4E43d5493eb96e01100908FCcc4f',
  '0x92a0f75a0f07C90a7EcB65eDD549Fa6a45a4975C',
  '0xE07BdaAc4573a00208D148bD5b3e5d2Ae4Ebd0Cc',
  '0xa5B8cdd3787832AdEdFe5a04bF4A307051538FF2',
  '0x866FD0028eb7fc7eeD02deF330B05aB503e199d4',
  '0xb037581cF0cE10b04C4735443d95e0C93db5d940',
  '0xa6C29a422D1612293669156a34f2793526783622',
  '0x52cFa188A1468A521A98eaa798E715Fbb9eb38a3',
  '0x22af73683dee5D266B0c36c37D0Fd62c402Fd250',
  '0x549d2e2B4fA19179CA5020A981600571C2954F6a',
  '0x0Ba950F0f099229828c10a9B307280a450133FFc',
  '0x0243A20B20ECa78ddEDF6b8ddb43a0286438A67A',
  '0xC341c6a006cab105E8CD2518e25aaB311Cb22FF6',
  '0xA599d6b81eC4a5DDd8eCa85e3AAc31E006aF00AA',
  '0x285F793CE97079D4a5712E616AFBbb971Dbf1f1f',
  '0x633e538EcF0bee1a18c2EDFE10C4Da0d6E71e77B',
  '0x7D52a1697F2dF08E6fb2b5A88E0E8e4D7C11a921',
  '0x0d17e7B77C678C79C3ab5176e164FF0BCceb8EAa',
  '0x81fa6F9F4599c5316Cc53B782DE7c01EFf4f9551',
  '0xFdb7D4AbD0109b36667946726dF943E83570286C',
  '0x7f0320cef62C88CE1DB7d77c1849082C053E2344',
  '0x203Ee29ba85BbDfA23bFaE5D77620AeFDaf92cB1',
  '0xac7D40638271D349cb2DeDfdC6268A77738403Fa',
  '0xac20925e6615ad6871987e199783Fa80Bf24EB39',
  '0x74fdc215f8309Ec58Fd34455bf3Fee95FB3416dD',
  '0xE0aca387C6600b455CCFC32B253e2DB13b71ca62',
];
let pools = {};

async function getTokens(address, web3) {
  try {
    if (!pools[address]) {
      const contract = new web3.eth.Contract(POOL_ABI, address);
      try {
        pools[address] = await contract.methods.stakingToken().call();
      } catch {
        pools[address] = await contract.methods.token().call();
      }
      pools[address] = pools[address].toLowerCase();
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  await Promise.all(POOL_ADDRESSES.map((address) => getTokens(address, web3)));

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    POOL_ADDRESSES,
    POOL_ABI,
    'balance',
    [],
    block,
    chain,
    web3,
  );

  const stakingTokenBalances = [];
  POOL_ADDRESSES.forEach((address, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      stakingTokenBalances.push({
        token: pools[address],
        balance,
      });
    }
  });

  formatter.sumMultiBalanceOf(balances, stakingTokenBalances, chain, provider);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
