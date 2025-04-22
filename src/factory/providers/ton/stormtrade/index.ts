import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const CONTRACT_ADDRESSES = [
  'EQDynReiCeK8xlKRbYArpp4jyzZuF6-tYfhFM0O5ulOs5H0L',
  'EQDpJnZP89Jyxz3euDaXXFUhwCWtaOeRmiUJTi3jGYgF8fnj',
  'EQAz6ehNfL7_8NI7OVh1Qg46HsuC4kFpK-icfqK9J3Frd6CJ',
  'EQBwfRtqEf3ZzhkeGsmXiC7hzTh1C5zZZzLgDH5VL8gENQ2A', // Notcoin prelaunch
  'EQAG8_BzwlWkmqb9zImr9RJjjgZZCLMOQXP9PR0B1PYHvfSS', // Notcoin vault
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
