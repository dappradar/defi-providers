import BigNumber from 'bignumber.js';
import STORAGE_ABI from './storageABI.json';
import RESERVE_ABI from './reserveABI.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';

const NETWORK_ADDRESS = '0xc8fb12402cb16970f3c5f4b48ff68eb9d1289301';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 10403228) {
    return {};
  }

  /* pull kyber market addresses */
  const contract = new web3.eth.Contract(STORAGE_ABI, NETWORK_ADDRESS);
  const reserveAddresses = await contract.methods
    .getReserves()
    .call(null, block);

  const reserveIDs = await util.executeMultiCallsOfTarget(
    NETWORK_ADDRESS,
    STORAGE_ABI,
    'getReserveId',
    reserveAddresses.map((address) => [address]),
    block,
    chain,
    web3,
  );
  const tokenResults = await util.executeMultiCallsOfTarget(
    NETWORK_ADDRESS,
    STORAGE_ABI,
    'getListedTokensByReserveId',
    reserveIDs.map((id) => [id]),
    block,
    chain,
    web3,
  );

  let addressList = [];
  let tokenList = [];
  reserveAddresses.forEach((address, index) => {
    if (tokenResults[index][0]) {
      const tokens = tokenResults[index][0].split(',');
      addressList = addressList.concat(tokens.map((token) => address));
      tokenList = tokenList.concat(tokens);
    }
  });

  const results = await util.executeMultiCallsOfMultiTargets(
    addressList,
    RESERVE_ABI,
    'getBalance',
    tokenList.map((token) => [token]),
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  results.forEach((result, index) => {
    const balance = BigNumber(result || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: tokenList[index],
        balance,
      });
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
