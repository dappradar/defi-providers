import BigNumber from 'bignumber.js';

/**
 * Gets TVL of comonly used cosmos DEX clone
 *
 * @param factoryAddress - The address of factory
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param provider - the provider folder name
 * @param web3 - The Web3 object
 * @returns The standard balances object
 *
 */
async function getTvl(
  factoryAddress: string,
  block: number,
  chain: string,
  provider: string,
  web3: any,
): Promise<{ [key: string]: string }> {
  const limit = 30;
  let pairs = [];
  let iterationPairs = [];

  do {
    const start_after = pairs.length
      ? pairs[pairs.length - 1].asset_infos
      : undefined;

    const query = {
      limit,
      ...(start_after && { start_after }),
    };

    iterationPairs = await web3.eth
      .call(factoryAddress, 'pairs', query)
      .then((response) => response['pairs']);

    pairs = pairs.concat(iterationPairs);
  } while (iterationPairs.length > 0);

  const balances = {};

  for (const pair of pairs) {
    const poolData = await web3.eth.call(pair.contract_addr, 'pool', {});

    if (poolData.assets[0].amount !== '0')
      try {
        balances[poolData.assets[0].info.native_token.denom] = BigNumber(
          balances[poolData.assets[0].info.native_token.denom] || 0,
        ).plus(poolData.assets[0].amount);
      } catch {
        balances[poolData.assets[0].info.token.contract_addr] = BigNumber(
          balances[poolData.assets[0].info.token.contract_addr] || 0,
        ).plus(poolData.assets[0].amount);
      }
    if (poolData.assets[1].amount !== '0')
      try {
        balances[poolData.assets[1].info.native_token.denom] = BigNumber(
          balances[poolData.assets[1].info.native_token.denom] || 0,
        ).plus(poolData.assets[1].amount);
      } catch {
        balances[poolData.assets[1].info.token.contract_addr] = BigNumber(
          balances[poolData.assets[1].info.token.contract_addr] || 0,
        ).plus(poolData.assets[1].amount);
      }
  }
  return balances;
}

export default {
  getTvl,
};
