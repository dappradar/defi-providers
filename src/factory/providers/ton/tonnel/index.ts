import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const CONTRACT_ADDRESSES = [
  'EQBemaU1eAM-fJP7tSniJGEmltPjitgGnlrP6UaXI7nzmEuV',
  'EQBZ0-2-isPEN_lIyg9eqXO_RFWrl_PWIJq5K6SVcUwne23W',
  'EQBYpQiQMwGBMzhOlJ52e4yXmcKCB_5uTTJ7bVSGqr-8YANi',
  'EQB-s4WzIgGP9U6DNlFH_kSn0JuxhBCBXr_rKz2ztEiozTto',
  'EQD7U_FPYRFTGgiqrpiKh8_giyrIQHZtokUKvz2EmWvlmViC',
  'EQCZXyOWRih3jtyhdCA7DV7KXluNbzqeIpJPnRkF4KEE1STp',
  'EQC14SC0-P0iOXzn1971HVIDsCzQ0LllY0y5O7EE2pMLe9pT',
  'EQDTs-yjPLn7XzaRRq8pjp7H8Nw4y_OJ51Bk2dcrPlIYgwtV',
  'EQAgoyECSzCIFTFkMIvDLgdUE3D9RxGfYQQGfxy3lBBc_Ke_',
  'EQDzAhS3Ev8cxEBJ96MIqPjxyD_k0L3enzDWnQ3Z-4tUK1h5',
  'EQASyc8d2DjZHrFevnF432NRLc4qwh6HGUPAbMvbofMkeRZl',
  'EQCNoApBzMacKKdTwcvi1iOx78e98bTSaN1Gx_nnmd3Ek5Yn',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  let balances;

  for (const contractAdress of CONTRACT_ADDRESSES) {
    const accountBalances = await web3.eth.getAccountBalances(contractAdress);
    balances = formatter.sum([balances, accountBalances]);
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
