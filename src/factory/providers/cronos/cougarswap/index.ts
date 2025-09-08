import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const START_BLOCK = 0;
const MASTERCHEF = '0x5795BE23A2C330209849e0D1D19cc05755E23Ca2';

const ABI = [
  {
    constant: true,
    inputs: [],
    name: 'poolLength',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'poolInfo',
    outputs: [
      { internalType: 'address', name: 'want', type: 'address' },
      { internalType: 'uint256', name: 'allocPoint', type: 'uint256' },
      { internalType: 'uint256', name: 'lastRewardBlock', type: 'uint256' },
      { internalType: 'uint256', name: 'accAQUAPerShare', type: 'uint256' },
      { internalType: 'address', name: 'strat', type: 'address' },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'wantLockedTotal',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = {};

  try {
    console.log(
      `[Cougarswap] Getting TVL for block ${block} on chain ${chain}`,
    );
    console.log(`[Cougarswap] Masterchef address: ${MASTERCHEF}`);

    // Get pool count
    const poolLength = await util.executeCall(
      MASTERCHEF,
      ABI,
      'poolLength',
      [],
      block,
      chain,
      web3,
    );

    console.log(`[Cougarswap] Pool count: ${poolLength}`);

    if (poolLength && poolLength > 0) {
      // Get all pool info
      const poolIndices = Array.from(
        { length: parseInt(poolLength) },
        (_, i) => i,
      );

      const poolInfos = await util.executeMultiCallsOfTarget(
        MASTERCHEF,
        ABI,
        'poolInfo',
        poolIndices.map((i) => [i]),
        block,
        chain,
        web3,
      );

      console.log(`[Cougarswap] Retrieved ${poolInfos.length} pool infos`);

      // Filter out pools with null strategy
      const validPools = poolInfos.filter(
        (pool) =>
          pool &&
          pool.strat &&
          pool.strat !== '0x0000000000000000000000000000000000000000' &&
          pool.want &&
          pool.want !== '0x0000000000000000000000000000000000000000',
      );

      console.log(
        `[Cougarswap] Valid pools after filtering: ${validPools.length}`,
      );

      if (validPools.length > 0) {
        // Get locked amounts from each strategy
        const lockedAmounts = await util.executeCallOfMultiTargets(
          validPools.map((pool) => pool.strat),
          ABI,
          'wantLockedTotal',
          [],
          block,
          chain,
          web3,
        );

        console.log(
          `[Cougarswap] Retrieved locked amounts for ${lockedAmounts.length} pools`,
        );

        // Sum up balances for each token
        validPools.forEach((pool, index) => {
          const tokenAddress = pool.want.toLowerCase();
          const amount = lockedAmounts[index];

          if (amount && amount > 0) {
            console.log(
              `[Cougarswap] Pool ${index}: ${tokenAddress} = ${amount}`,
            );

            if (balances[tokenAddress]) {
              balances[tokenAddress] = balances[tokenAddress].plus(amount);
            } else {
              balances[tokenAddress] = amount;
            }
          }
        });

        console.log(
          `[Cougarswap] Final token balances:`,
          Object.keys(balances).length,
        );
      }
    }
  } catch (error) {
    console.log('[Cougarswap] Error getting cougarswap TVL:', error);
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
