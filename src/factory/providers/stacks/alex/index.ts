import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
const vaultAddress = 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.alex-vault';

async function calculate(walletAddress, block, balances, web3) {
  const accountBalances = await web3.eth.getAccountBalances(
    walletAddress,
    block,
  );

  web3.eth.extractBalances(accountBalances, balances);
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 45438) {
    return {};
  }

  const balances = {};
  await calculate(vaultAddress, block, balances, web3);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
