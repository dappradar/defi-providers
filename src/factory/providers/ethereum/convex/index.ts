import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const MANAGER_ADDRESS = '0xF403C135812408BFbE8713b5A23a04b3D48AAE31';
const STAKER_ADDRESS = '0x989aeb4d175e16225e39e87d0d97a3360524ad80';
const CRV_ADDRESS = '0xd533a949740bb3306d119cc777fa900ba034cd52';
const CVX_ADDRESS = '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b';
const CVX_STAKING_ADDRESS = '0xCF50b810E57Ac33B91dCF525C6ddd9881B139332';
const CVX_LOCKER_ADDRESS = '0x72a19342e8F1838460eBFCCEf09F6585e32db86E';
const FXS_ADDRESS = '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0';
const PRISMA_ADDRESS = '0xdA47862a83dac0c112BA89c6abC2159b95afd71C';
const FXN_ADDRESS = '0x365AccFCa291e7D3914637ABf1F7635dB165Bb09';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 12450992) {
    return {};
  }

  const balances = {};

  // Get pool length
  const poolLength = await util.executeCall(
    MANAGER_ADDRESS,
    [abi['poolLength']],
    'poolLength',
    [],
    block,
    chain,
    web3,
  );
  console.log('Pool length:', poolLength);

  // Get all pool info
  const poolIndexes = Array.from({ length: Number(poolLength) }, (_, i) => i);
  const poolInfos = await util.executeMultiCallsOfTarget(
    MANAGER_ADDRESS,
    [abi['poolInfo']],
    'poolInfo',
    poolIndexes.map((index) => [index]),
    block,
    chain,
    web3,
  );
  console.log('Pool infos length:', poolInfos.length);
  console.log('First 3 pool infos:', poolInfos.slice(0, 3));

  // Extract unique gauges and their corresponding LP tokens
  const uniqueGauges = [];
  const gaugeToLpToken = {};

  poolInfos.forEach((poolInfo, index) => {
    console.log(`Pool ${index}:`, poolInfo);
    if (poolInfo && poolInfo.gauge && poolInfo.lptoken) {
      const gauge = poolInfo.gauge.toLowerCase();
      const lptoken = poolInfo.lptoken.toLowerCase();

      if (!gaugeToLpToken[gauge]) {
        uniqueGauges.push(gauge);
        gaugeToLpToken[gauge] = lptoken;
        console.log(`Added gauge ${gauge} -> LP token ${lptoken}`);
      }
    }
  });
  console.log('Total unique gauges:', uniqueGauges.length);

  // Get gauge balances
  const gaugeBalances = await util.executeCallOfMultiTargets(
    uniqueGauges,
    ERC20_ABI,
    'balanceOf',
    [STAKER_ADDRESS],
    block,
    chain,
    web3,
  );
  console.log('Gauge balances length:', gaugeBalances.length);
  console.log('First 5 gauge balances:', gaugeBalances.slice(0, 5));

  // Sum balances by LP token
  gaugeBalances.forEach((balance, index) => {
    console.log(
      `Gauge ${index} balance:`,
      balance,
      'for gauge:',
      uniqueGauges[index],
    );
    if (balance && BigNumber(balance).gt(0)) {
      const gauge = uniqueGauges[index];
      const lptoken = gaugeToLpToken[gauge];

      balances[lptoken] = BigNumber(balances[lptoken] || 0)
        .plus(BigNumber(balance))
        .toFixed();
      console.log(`Added ${balance} to LP token ${lptoken}`);
    }
  });
  console.log(
    'Balances after gauge processing:',
    Object.keys(balances).length,
    'tokens',
  );

  // Add cvxCRV supply
  const cvxCRVSupply = await util.getTotalSupply(
    '0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7',
    block,
    web3,
  );
  console.log('cvxCRV supply result:', cvxCRVSupply);
  if (cvxCRVSupply) {
    balances[CRV_ADDRESS] = BigNumber(balances[CRV_ADDRESS] || 0)
      .plus(BigNumber(cvxCRVSupply.totalSupply))
      .toFixed();
    console.log('Added cvxCRV supply:', cvxCRVSupply.totalSupply.toString());
  }

  // Add CVX staked in rewards
  const cvxStaked = await util.executeCall(
    CVX_STAKING_ADDRESS,
    ERC20_ABI,
    'balanceOf',
    [CVX_ADDRESS],
    block,
    chain,
    web3,
  );
  console.log('CVX staked result:', cvxStaked);
  balances[CVX_ADDRESS] = BigNumber(balances[CVX_ADDRESS] || 0)
    .plus(BigNumber(cvxStaked))
    .toFixed();
  console.log('Added CVX staked:', cvxStaked);

  // Add vote-escrowed token balances
  try {
    // veCRV locked
    const crvLocked = await util.executeCall(
      '0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2', // veCRV
      ERC20_ABI,
      'balanceOf',
      [STAKER_ADDRESS],
      block,
      chain,
      web3,
    );
    console.log('veCRV locked result:', crvLocked);
    balances[CRV_ADDRESS] = BigNumber(balances[CRV_ADDRESS] || 0)
      .plus(BigNumber(crvLocked))
      .toFixed();
    console.log('Added veCRV locked:', crvLocked);
  } catch (error) {
    console.error('Error getting veCRV locked:', error.message);
  }

  try {
    // veFXS locked
    const fxsLocked = await util.executeCall(
      '0xc8418af6358ffdda74e09ca9cc3fe03ca6adc5b0', // veFXS
      ERC20_ABI,
      'balanceOf',
      ['0x59cfcd384746ec3035299d90782be065e466800b'], // Convex Frax vote proxy
      block,
      chain,
      web3,
    );
    console.log('veFXS locked result:', fxsLocked);
    balances[FXS_ADDRESS] = BigNumber(balances[FXS_ADDRESS] || 0)
      .plus(BigNumber(fxsLocked))
      .toFixed();
    console.log('Added veFXS locked:', fxsLocked);
  } catch (error) {
    console.error('Error getting veFXS locked:', error.message);
  }

  try {
    // PRISMA locked
    const prismaLocked = await util.executeCall(
      '0x3f78544364c3eCcDCe4d9C89a630AEa26122829d', // PRISMA locker
      [
        {
          inputs: [{ internalType: 'address', name: '', type: 'address' }],
          name: 'getAccountBalances',
          outputs: [
            { internalType: 'uint256', name: '', type: 'uint256' },
            { internalType: 'uint256', name: '', type: 'uint256' },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      'getAccountBalances',
      ['0x8ad7a9e2B3Cd9214f36Cb871336d8ab34DdFdD5b'], // Convex Prisma vote proxy
      block,
      chain,
      web3,
    );
    console.log('PRISMA locked result:', prismaLocked);
    if (prismaLocked && prismaLocked[0]) {
      balances[PRISMA_ADDRESS] = BigNumber(balances[PRISMA_ADDRESS] || 0)
        .plus(BigNumber(prismaLocked[0]).times(1e18))
        .toFixed();
      console.log('Added PRISMA locked:', prismaLocked[0]);
    }
  } catch (error) {
    console.error('Error getting PRISMA locked:', error.message);
  }

  try {
    // veFXN locked
    const fxnLocked = await util.executeCall(
      '0xEC6B8A3F3605B083F7044C0F31f2cac0caf1d469', // veFXN
      ERC20_ABI,
      'balanceOf',
      ['0xd11a4Ee017cA0BECA8FA45fF2abFe9C6267b7881'], // Convex F(x) vote proxy
      block,
      chain,
      web3,
    );
    console.log('veFXN locked result:', fxnLocked);
    balances[FXN_ADDRESS] = BigNumber(balances[FXN_ADDRESS] || 0)
      .plus(BigNumber(fxnLocked))
      .toFixed();
    console.log('Added veFXN locked:', fxnLocked);
  } catch (error) {
    console.error('Error getting veFXN locked:', error.message);
  }

  formatter.convertBalancesToFixed(balances);
  console.log('Final balances count:', Object.keys(balances).length);
  console.log('Final balances:', balances);
  return { balances };
}

async function staking(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

  const balances = {};

  // Get CVX balances from both staking contracts
  const [cvxStakedRewards, cvxStakedLocker] = await Promise.all([
    util.executeCall(
      CVX_STAKING_ADDRESS,
      ERC20_ABI,
      'balanceOf',
      [CVX_ADDRESS],
      block,
      chain,
      web3,
    ),
    util.executeCall(
      CVX_LOCKER_ADDRESS,
      ERC20_ABI,
      'balanceOf',
      [CVX_ADDRESS],
      block,
      chain,
      web3,
    ),
  ]);

  balances[CVX_ADDRESS] = BigNumber(cvxStakedRewards || 0)
    .plus(BigNumber(cvxStakedLocker || 0))
    .toFixed();

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl, staking };
