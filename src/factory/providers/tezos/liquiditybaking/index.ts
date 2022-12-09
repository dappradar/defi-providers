import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const DEX_ADDRESS = 'KT1TxqZ8QtKvLu3V3JH7Gx58n7Co8pgtpQU5';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1589247) {
    return {};
  }

  const contract = new web3.eth.Contract(null, DEX_ADDRESS);
  await contract.init();
  const token = await contract.methods.tokenAddress().call();
  const balance = await contract.methods.tokenPool().call(null, block);
  const tezosBalance = await contract.methods.xtzPool().call(null, block);

  const balances = {
    [token]: balance,
    xtz: tezosBalance,
  };
  console.log(balances);
  return { balances };
}

export { tvl };
