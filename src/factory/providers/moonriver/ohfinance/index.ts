import BigNumber from 'bignumber.js';
import ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

let banks = {};
const BANKS = [
  '0x4C211F45876d8EC7bAb54CAc0e32AAD15095358A',
  '0xdeA7Ff1D84B7E54587b434C1A585718857CF61d1',
];

async function getUnderlying(address, web3) {
  try {
    const contract = new web3.eth.Contract(ABI, address);
    const underlying = await contract.methods.underlying().call();
    banks[address] = underlying;
  } catch {}
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1530681) {
    return {};
  }

  try {
    banks = basicUtil.readDataFromFile('pools.json', chain, provider);
  } catch {}

  await Promise.all(BANKS.map((bank) => getUnderlying(bank, web3)));
  basicUtil.writeDataToFile(banks, 'pools.json', chain, provider);
  // Get V1 tokens locked
  const results = await util.executeCallOfMultiTargets(
    BANKS,
    ABI,
    'investedBalance',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  results.forEach((result, index) => {
    if (result) {
      balanceResults.push({
        token: banks[BANKS[index]],
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
