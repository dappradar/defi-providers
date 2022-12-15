import POOL_ABI from './abi.json';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';

const POOL_ADDRESS = '0x35fFd6E268610E764fF6944d07760D0EFe5E40E5';

async function tvl(params) {
  const { block, chain, provider, web3 } = params;
  if (block < 11755954) {
    return {};
  }

  let pools = {};
  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const contract = new web3.eth.Contract(POOL_ABI, POOL_ADDRESS);
  const tokens = [];
  for (let i = 0; ; i++) {
    try {
      if (!pools[i]) {
        pools[i] = await contract.methods.registeredTokens(i).call(null, block);
      }
      if (pools[i] != '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        tokens.push(pools[i]);
      }
    } catch (e) {
      break;
    }
  }
  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const balances = {};
  try {
    balances['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'] = (
      await web3.eth.getBalances(POOL_ADDRESS, block)
    ).output[0].balance;
  } catch {}

  const balanceResults = await util.getTokenBalances(
    POOL_ADDRESS,
    tokens,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, balanceResults);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
