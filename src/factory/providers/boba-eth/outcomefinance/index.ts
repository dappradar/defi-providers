import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';

const START_BLOCK = 291475;
const LSP_CREATORS = ['0xC064b1FE8CE7138dA4C07BfCA1F8EEd922D41f68'];
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
        `Loaded cache: last block ${cachedData.lastProcessedBlock}, ${cachedData.lspPools.length} LSP pools`,
      );
    } catch (error) {
      console.log('No cached data found, starting from scratch');
    }

    let lspPools = cachedData.lspPools || [];
    const lastProcessedBlock = cachedData.lastProcessedBlock || START_BLOCK;

    // Only process new blocks if needed
    if (lastProcessedBlock < block) {
      let iterationCount = 0;

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
          lspPools,
        },
        'outcomefinance_data.json',
        chain,
        provider,
      );
    }

    console.log(`Found ${lspPools.length} LSP pools`);

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

    const validLspTokens = lspTokens.filter((token) => token !== null);
    const validLspPools = lspPools.filter((_, i) => lspTokens[i] !== null);

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
