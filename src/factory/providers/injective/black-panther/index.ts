import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';

const USDT_ADDRESS = 'peggy0xdAC17F958D2ee523a2206206994597C13D831ec7';
const FARM_ADDRESSES = [
  'inj1yjnm0d6lxpuk8a4eulnf80gcx954zcf8rq2sfp',
  'inj1lw5pd768ghux6dsux24tnqxlqz5pln6kk9rd6c',
];
const METHOD = 'total_vaults_in_usdt';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  let farmBalance = await web3.eth.call(FARM_ADDRESSES[0], METHOD);
  balances[USDT_ADDRESS] = farmBalance;
  farmBalance = await web3.eth.call(FARM_ADDRESSES[1], METHOD);
  balances[USDT_ADDRESS] = BigNumber(balances[USDT_ADDRESS] || 0).plus(
    farmBalance,
  );

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
