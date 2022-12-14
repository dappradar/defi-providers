import basicUtil from '../../../../util/basicUtil';
import CHEF_ABI from './abis/chef.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const SMART_CHEF_FACTORY = '0xfff5812c35ec100df51d5c9842e8cc3fe60f9ad7';
let pools = {
  block: 14661669,
  chefs: {},
};

async function getBalances(block, chain, provider, web3) {
  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  try {
    for (let i = pools.block; i < block; i += 10000) {
      const endBlock = Math.min(i + 10000, block);
      console.log(`Getting chefs from block ${i} to ${endBlock}`);

      const poolLogs = (
        await util.getLogs(
          i,
          endBlock,
          '0xe0d103a92c6ff6c4aceb49d436f4028e0deb4884fdbcb9f32b03045eabb44a6c',
          SMART_CHEF_FACTORY,
          web3,
        )
      ).output;
      poolLogs.forEach((output) => {
        const chefAddress = `0x${output.topics[1].slice(26)}`;
        if (!pools.chefs[chefAddress]) {
          pools.chefs[chefAddress] = {};
        }
      });
      pools.block = endBlock;
    }
  } catch (e) {
    console.log(e);
  }

  const chefs = Object.keys(pools.chefs);
  const newChefs = chefs.filter((address) => !pools.chefs[address].stakedToken);
  const stakedTokens = await util.executeCallOfMultiTargets(
    newChefs,
    CHEF_ABI,
    'stakedToken',
    [],
    block,
    chain,
    web3,
  );
  stakedTokens.forEach((token, index) => {
    pools.chefs[newChefs[index]].stakedToken = token;
  });

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const tokenBalances = await util.getTokenBalancesOfHolders(
    chefs,
    chefs.map((address) => pools.chefs[address].stakedToken),
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances);

  return balances;
}

export { getBalances };
