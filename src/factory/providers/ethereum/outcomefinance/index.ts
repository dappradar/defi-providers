import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';

const START_BLOCK = 9937650;
const EMP_CREATORS = [
  '0xad8fD1f418FB860A383c9D4647880af7f043Ef39',
  '0x9A077D4fCf7B26a0514Baa4cff0B481e9c35CE87',
  '0xddfC7E3B4531158acf4C7a5d2c3cB0eE81d018A5',
];
const LSP_CREATORS = [
  '0x0b8de441B26E36f461b2748919ed71f50593A67b',
  '0x60F3f5DDE708D097B7F092EFaB2E085AC0a82F42',
  '0x31C893843685f1255A26502eaB5379A3518Aa5a9',
  '0x9504b4ab8cd743b06074757d3B1bE3a3aF9cea10',
  '0x439a990f83250FE2E5E6b8059F540af1dA1Ba04D',
];
const CREATED_EXPIRING_MULTI_PARTY_TOPIC =
  '0xf360b00b309dfe6565667df6b06eab15d0e0958d5e82d89a399ae7dd417b4b09';
const CREATED_LONG_SHORT_PAIR_TOPIC =
  '0xd007d1b8d04c15a0cadef913ed5a5c4b381d3dcd2927c2de9a6dcc1ddab2d2f8';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  if (block < START_BLOCK) {
    return { balances };
  }

  try {
    // Initialize cache objects
    let cachedData = {
      lastProcessedBlock: START_BLOCK,
      empPools: [],
      lspPools: [],
    };

    // Try to load cached data
    try {
      cachedData = await basicUtil.readFromCache(
        'outcomefinance_data.json',
        chain,
        provider,
      );
      console.log(
        `Loaded cache: last block ${cachedData.lastProcessedBlock}, ${cachedData.empPools.length} EMP pools, ${cachedData.lspPools.length} LSP pools`,
      );
    } catch (error) {
      console.log('No cached data found, starting from scratch');
    }

    let empPools = cachedData.empPools || [];
    let lspPools = cachedData.lspPools || [];
    const lastProcessedBlock = cachedData.lastProcessedBlock || START_BLOCK;

    // Only process new blocks if needed
    if (lastProcessedBlock < block) {
      let iterationCount = 0;

      // Process EMP pools
      for (const factory of EMP_CREATORS) {
        try {
          const CHUNK_SIZE = 10000;
          for (
            let fromBlock = lastProcessedBlock;
            fromBlock <= block;
            fromBlock += CHUNK_SIZE
          ) {
            const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, block);
            console.log(
              `Fetching EMP logs from block ${fromBlock} to ${toBlock}`,
            );

            const logs = await util.getLogs(
              fromBlock,
              toBlock,
              CREATED_EXPIRING_MULTI_PARTY_TOPIC,
              factory,
              web3,
            );

            if (logs && logs.output) {
              const addresses = logs.output.map((log) => {
                return `0x${log.topics[1].slice(26).toLowerCase()}`;
              });
              empPools = empPools.concat(addresses);
            }

            // Save progress every 5 iterations
            iterationCount++;
            if (iterationCount % 5 === 0) {
              await basicUtil.saveIntoCache(
                {
                  lastProcessedBlock: toBlock,
                  empPools,
                  lspPools,
                },
                'outcomefinance_data.json',
                chain,
                provider,
              );
              console.log(`Saved progress at block ${toBlock}`);
            }
          }
        } catch (error) {
          console.log(`Error getting EMP logs for factory ${factory}:`, error);
        }
      }

      // Process LSP pools
      for (const factory of LSP_CREATORS) {
        try {
          const CHUNK_SIZE = 10000;
          for (
            let fromBlock = lastProcessedBlock;
            fromBlock <= block;
            fromBlock += CHUNK_SIZE
          ) {
            const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, block);
            console.log(
              `Fetching LSP logs from block ${fromBlock} to ${toBlock}`,
            );

            const logs = await util.getLogs(
              fromBlock,
              toBlock,
              CREATED_LONG_SHORT_PAIR_TOPIC,
              factory,
              web3,
            );

            if (logs && logs.output) {
              const addresses = logs.output.map((log) => {
                return `0x${log.topics[1].slice(26).toLowerCase()}`;
              });
              lspPools = lspPools.concat(addresses);
            }

            // Save progress every 5 iterations
            iterationCount++;
            if (iterationCount % 5 === 0) {
              await basicUtil.saveIntoCache(
                {
                  lastProcessedBlock: toBlock,
                  empPools,
                  lspPools,
                },
                'outcomefinance_data.json',
                chain,
                provider,
              );
              console.log(`Saved progress at block ${toBlock}`);
            }
          }
        } catch (error) {
          console.log(`Error getting LSP logs for factory ${factory}:`, error);
        }
      }

      // Final save with the current block
      await basicUtil.saveIntoCache(
        {
          lastProcessedBlock: block,
          empPools,
          lspPools,
        },
        'outcomefinance_data.json',
        chain,
        provider,
      );
    }

    console.log(
      `Found ${empPools.length} EMP pools and ${lspPools.length} LSP pools`,
    );

    // Get collateral tokens for EMP pools
    const empTokens = await Promise.all(
      empPools.map(async (pool) => {
        try {
          return await util.executeCall(
            pool,
            [
              {
                constant: true,
                inputs: [],
                name: 'collateralCurrency',
                outputs: [
                  { internalType: 'address', name: '', type: 'address' },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
              },
            ],
            'collateralCurrency',
            [],
            block,
            chain,
            web3,
          );
        } catch (error) {
          console.log(`Error getting collateral for EMP pool ${pool}:`, error);
          return null;
        }
      }),
    );

    // Get collateral tokens for LSP pools
    const lspTokens = await Promise.all(
      lspPools.map(async (pool) => {
        try {
          return await util.executeCall(
            pool,
            [
              {
                constant: true,
                inputs: [],
                name: 'collateralToken',
                outputs: [
                  { internalType: 'address', name: '', type: 'address' },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
              },
            ],
            'collateralToken',
            [],
            block,
            chain,
            web3,
          );
        } catch (error) {
          console.log(`Error getting collateral for LSP pool ${pool}:`, error);
          return null;
        }
      }),
    );

    // Filter out null values
    const validEmpTokens = empTokens.filter((token) => token !== null);
    const validLspTokens = lspTokens.filter((token) => token !== null);
    const validEmpPools = empPools.filter((_, i) => empTokens[i] !== null);
    const validLspPools = lspPools.filter((_, i) => lspTokens[i] !== null);

    // Get token balances for EMP pools
    if (validEmpPools.length > 0 && validEmpTokens.length > 0) {
      const empBalances = await util.getTokenBalancesOfEachHolder(
        validEmpPools,
        validEmpTokens,
        block,
        chain,
        web3,
      );
      formatter.sumMultiBalanceOf(balances, empBalances, chain, provider);
    }

    // Get token balances for LSP pools
    if (validLspPools.length > 0 && validLspTokens.length > 0) {
      const lspBalances = await util.getTokenBalancesOfEachHolder(
        validLspPools,
        validLspTokens,
        block,
        chain,
        web3,
      );
      formatter.sumMultiBalanceOf(balances, lspBalances, chain, provider);
    }
  } catch (error) {
    console.log('Error processing OutcomeFinance TVL:', error);
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
