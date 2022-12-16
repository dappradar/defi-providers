import BigNumber from 'bignumber.js';
import VAULT_ABI from './abi.json';
import VAULTS from './currentVaults.json';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

let data = {};

async function getTokens(address, web3) {
  try {
    const contract = new web3.eth.Contract(VAULT_ABI, address);

    if (!data[address]) {
      try {
        data[address] = await contract.methods.token().call();
      } catch (e) {
        console.log(e, address);
      }
      data[address] = data[address].toLowerCase();
    }
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11807861) {
    return {};
  }

  try {
    data = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  await Promise.all(VAULTS.map((vault) => getTokens(vault, web3)));

  basicUtil.writeDataToFile(data, 'cache/pools.json', chain, provider);

  const pools = Object.keys(data);
  const results = await util.executeCallOfMultiTargets(
    pools,
    VAULT_ABI,
    'balance',
    [],
    block,
    chain,
    web3,
  );
  const balanceResults = [];
  results.forEach((result, index) => {
    if (result) {
      balanceResults.push({
        token: data[pools[index]],
        balance: BigNumber(result),
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
