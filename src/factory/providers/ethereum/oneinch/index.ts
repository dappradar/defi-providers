import BigNumber from 'bignumber.js';
import FARMING_ABI from './abi/farmingAbi.json';
import POOL_ABI from './abi/poolAbi.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const FARMING_ADDRESSES = [
  '0x2ec255797fef7669fa243509b7a599121148ffba', //1INCH-ETH farm
  '0xd7936052d1e096d48c81ef3918f9fd6384108480', //1INCH-USDT farm
  '0x94bc2a1c732bcad7343b25af48385fe76e08734f', //1INCH-DAI farm
  '0x302a6eda4e2b2c563a80cc17bd80a1251b986677', //1INCH-USDC farm
  '0xa218543cc21ee9388fa1e509f950fd127ca82155', //1INCH-WBTC farm
  '0x13927a60c7bf4d3d00e3c1593e0ec713e35d2106', //1INCH-YFI farm
  '0x18D410f651289BB978Fc32F90D2d7E608F4f4560', //ETH-OPIUM farm
  '0x9070832CF729A5150BB26825c2927e7D343EabD9', //ETH-1INCH farm
  '0xA83fCeA9229C7f1e02Acb46ABe8D6889259339e8', //ETH-USDT farm
  '0x4dab1Ba9609C1546A0A69a76F00eD935b0b9C45e', //ETH-DAI farm
  '0x0DA1b305d7101359434d71eCEAab71E1fF5437e6', //ETH-USDC farm
  '0x98484d4259A70B73af58180521f2eB71a3F00Ae6', //ETH-WBTC farm
];
const POOLS = [
  '0x0ef1b8a0e726fc3948e15b23993015eb1627f210',
  '0x1f629794b34ffb3b29ff206be5478a52678b47ae',
  '0x6a11f3e5a01d129e566d783a7b6e8862bfd66cca',
  '0xfd979c8c2b4b42bf6bec5191a413ab800c767602',
  '0xe179d801e6882e628d6ce58b94b3c41e35c8518a',
  '0x7beb4793892491606a51d531f2ec665e1a9bf5ea',
  '0x822e00a929f5a92f3565a16f92581e54af2b90ea',
  '0x2c4ea51d9dec7cdabe2d1bde01882f87b5231d21',
  '0xaa8adbdd94824e5c381ca4a262762945b353359f',
  '0x57fbb3704609da720546898fcfbad910fcf49e25',
  '0x69ab07348f51c639ef81d7991692f0049b10d522',
  '0xcb0169060834b6ff8b9bdc455a9c93c75a3c1f57',
  '0xbba17b81ab4193455be10741512d0e71520f43cb',
  '0x7566126f2fd0f2dddae01bb8a6ea49b760383d5a',
  '0xb4db55a20e0624edd82a0cf356e3488b4669bd27',
  '0xc1a900ae76db21dc5aa8e418ac0f4e888a4c7431',
  '0xf15a6db8d536a2b8de10f48f62571905d414c3e1',
  '0x4d5f08eccd3d9281632aa3fc6937e98441564544',
  '0xa90b24fb781c761b3088b4769acefd0b27d21e7e',
  '0x4020819c2c96962460fd1ce0c1eba8a52747d4a5',
  '0x1dce26f543e591c27717e25294aebbf59ad9f3a5',
  '0x4df8fdc5c8f9e5d4de2b2ae6fe9c5a2d320544a9',
  '0x6483e37006ef82191575ed27f64774007a618a8d',
  '0xf61b85d46e25fc768536240bca56c372ba78c95b',
  '0xf7c88430faebc9aae3b0c3f61b3898b7906054a5',
  '0x5637f7367832de73cea409482576d3b48b2a94c5',
  '0xca6993d4a4e1ae19f98e64ee4069c43d759461ee',
  '0xd1345833909410824fc5cc62199ffc3ec2769671',
  '0xf39b0a6c5d2f223fe8d823492855a34b4efe32b0',
  '0x0f843adc4cd45f1c2951fad242a514adc26a7ba5',
  '0xc6fd0616e0fc2a3c7160359726e50affdade1f0e',
  '0xbe5f092e7b6d6695cbe4d166ff5fb18b54c0fdff',
  '0xd471b6755eba924ad94dd9144ea50022010efccc',
  '0xfbc8b082a7658e004955f1b7c71c68a4a5268583',
  '0x8eb62623ae8b684a83193590a88e64eb26b295ad',
  '0xa5a78b90cbaba91e4e219d6e98836e528c68b869',
  '0xcee0932a4de891d8e5ec0d8d95c02f5ae54a0643',
  '0x9f1ec47ddd53ac085bda19fdb4a9f70ceeb93f19',
];
const ETH = '0x0000000000000000000000000000000000000000';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11511393) return {};

  const [stakeTokens, rewardTokens] = await Promise.all([
    util.executeCallOfMultiTargets(
      FARMING_ADDRESSES,
      FARMING_ABI,
      'mooniswap',
      [],
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      FARMING_ADDRESSES,
      FARMING_ABI,
      'gift',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  const [stakeBalances, rewardBalances] = await Promise.all([
    util.executeCallOfMultiTargets(
      stakeTokens,
      ERC20_ABI,
      'totalSupply',
      [],
      block,
      chain,
      web3,
    ),
    util.executeMultiCallsOfMultiTargets(
      rewardTokens,
      ERC20_ABI,
      'balanceOf',
      FARMING_ADDRESSES.map((address) => [address]),
      block,
      chain,
      web3,
    ),
  ]);

  const balanceResults = [];
  stakeBalances.forEach((result, index) => {
    const stakeBalance = new BigNumber(result || 0);
    const rewardBalance = new BigNumber(rewardBalances[index] || 0);
    if (stakeBalance.isGreaterThan(0)) {
      balanceResults.push({
        token: stakeTokens[index].toLowerCase(),
        balance: stakeBalance,
      });
    }
    if (rewardBalance.isGreaterThan(0)) {
      balanceResults.push({
        token: rewardTokens[index].toLowerCase(),
        balance: rewardBalance,
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );

  const poolTokens = await util.executeCallOfMultiTargets(
    POOLS,
    POOL_ABI,
    'getTokens',
    [],
    block,
    chain,
    web3,
  );
  const poolTokensFlattened = poolTokens.flat(1);
  const poolTokenBalances = await util.executeMultiCallsOfMultiTargets(
    POOLS.flatMap((pool) => [pool, pool]),
    POOL_ABI,
    'getBalanceForAddition',
    poolTokensFlattened,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(
    balances,
    poolTokenBalances.map((poolTokenBalance, index) => ({
      token: poolTokensFlattened[index],
      balance: new BigNumber(poolTokenBalance),
    })),
  );
  if (balances[ETH]) {
    balances['eth'] = balances[ETH];
    delete balances[ETH];
  }
  return { balances };
}

export { tvl };
