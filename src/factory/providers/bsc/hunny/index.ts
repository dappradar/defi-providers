import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import POOL_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_ADDRESSES = [
  '0x434Af79fd4E96B5985719e3F5f766619DC185EAe',
  '0xb7D43F1beD47eCba4Ad69CcD56dde4474B599965',
  '0xAD4134F59C5241d0B4f6189731AA2f7b279D4104',
  '0xc212ba7Dec34308A4cb380612830263387150310',
  '0xBcCfD3e2Af166bB28B6b4Dfd6C1BF1F3f7F47632',
  '0xe763D7E9a14ADB928766C19DF4bcE580fb6393B3',
  '0xdFe440fBe839E9D722F3d1c28773850F99692c76',
  '0x6c7eFFa3d0694f8fc2D6aEe501ff484c1FE6fcD2',
  '0x65003459BF2506B096a9a9C8bC691e88430567D1',
  '0x12180BB36DdBce325b3be0c087d61Fce39b8f5A4',
  '0xD87F461a52E2eB9E57463B9A4E0e97c7026A5DCB',
  '0x31972E7bfAaeE72F2EB3a7F68Ff71D0C61162e81',
  '0x3B34AA6825fA731c69C63d4925d7a2E3F6c7f13C',
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
  if (block < 7906245) {
    return {};
  }

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

  const balanceResults = [];

  POOL_ADDRESSES.forEach((address, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: pools[address],
        balance,
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  return { balances };
}

export { tvl };
