import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const TOKENS = [
  '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
  '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
  'So11111111111111111111111111111111111111112',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'AGFEad2et2ZJif9jaGpdMixQqvW5i81aBdvKe7PHNfz3',
  'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  'Lrxqnh6ZHKbGy3dcrCED43nsoLkM1LTzU2jRfWe8qUC',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
];
const POOL = 'BxnUi6jyYbtEEgkBq4bPLKzDpSfWVAzgyf3TF2jfC1my';

async function getTokenBalance(address, account, web3) {
  const contract = new web3.eth.Contract(null, address);
  try {
    const balance = await contract.methods.balanceOf(account).call();
    return balance;
  } catch {
    return 0;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  const results = await Promise.all(
    TOKENS.map((token) => getTokenBalance(token, POOL, web3)),
  );

  TOKENS.forEach((token, index) => {
    if (BigNumber(results[index]).isGreaterThan(0)) {
      balances[token] = results[index];
    }
  });
  return { balances };
}

export { tvl };
