import chainWeb3 from '../../../../web3Provider/chainWeb3';

const START_BLOCK = 61147683;
const LINEAR_CONTRACT = 'linear-protocol.near';

async function tvl(params) {
  const { block, chain } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const web3 = chainWeb3.getWeb3(chain);

  balances[LINEAR_CONTRACT] = await web3.eth.callContractFunction(
    LINEAR_CONTRACT,
    'get_total_staked_balance',
    {},
    block,
  );

  return { balances };
}

export { tvl };
