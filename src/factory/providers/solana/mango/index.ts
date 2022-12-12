import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL = '9BVcYqEQxyccuwznvxXqDkSJFavvTyheiTYk231T1A8S';
const TOKENS = [
  'So11111111111111111111111111111111111111112',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
  'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
  '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
  'AGFEad2et2ZJif9jaGpdMixQqvW5i81aBdvKe7PHNfz3',
  '7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx',
  'KgV1GvrHQmRBY8sHQQeUKwTm2r2h8t4C8qt12Cw1HVE',
  '8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  '94jMUy411XNUw1CnkFr2514fq6KRc49W3kAmrjJiuZLx',
  'F6v4wfAdJB8D8p77bMXZgYt8TDKsYxLYxH5AFhUkYx9W',
];

async function getTokenBalance(token, account, web3) {
  const contract = new web3.eth.Contract(null, token);
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
