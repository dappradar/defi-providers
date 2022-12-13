import BigNumber from 'bignumber.js';
import VAULT_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const VAULT_ADDRESS = '0xE75D77B1865Ae93c7eaa3040B038D7aA7BC02F70';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11551793) {
    return {};
  }

  const contract = new web3.eth.Contract(VAULT_ABI, VAULT_ADDRESS);
  const assets = await contract.methods.getAllAssets().call(null, block);

  const results = await util.executeMultiCallsOfTarget(
    VAULT_ADDRESS,
    VAULT_ABI,
    'checkBalance',
    assets.map((asset) => [asset]),
    block,
    chain,
    web3,
  );

  const balanceResults = [];

  assets.forEach((address, index) => {
    const balance = BigNumber(results[index] || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: address,
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
