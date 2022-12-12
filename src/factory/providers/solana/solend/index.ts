import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const TOKENS = [
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
  '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
  'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'AGFEad2et2ZJif9jaGpdMixQqvW5i81aBdvKe7PHNfz3',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1',
  'MERt85fc5boKw3BW1eYdxonEuJNvXbiMbs6hvheau5K',
  'So11111111111111111111111111111111111111112',
  '9vMJfxuKxXBoEa7rM12mYLMwTacLMLDJqHozw96WQL8i',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm',
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
  'SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp',
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  'EzfgjvkSwthhgHaceR3LnKXUoRkP6NUhfghdaHAj1tUv',
  'C98A4nkJXhpVZNAZdHUA95RpTF3T4whtQubL3YobiUX9',
  'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX',
  'Ea5SjE2Y6yvCeW5dYTn7PYMuW5ikXkvbGdcmSnXeaLjS',
  '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT',
  'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp',
  'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx',
  'poLisWXnNRwC6oBu1vHiuKQzFjGL4XDSu4g9qjz9qVk',
  'xStpgUCss9piqeFUk2iLVcvJEGhAdJxJQuwLkXP555G',
  'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT',
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  'UXPhBoR3qG4UCiGNJfV7MqhHyFqKN68g45GoYvAeL2M',
];
const POOL = 'DdZR6zRFiUt4S5mg7AV1uKB2z1f1WzcNYCaTEEWPAuby';

async function getTokenBalance(address, account, web3) {
  const contract = new web3.eth.Contract(null, address);
  try {
    return await contract.methods.balanceOf(account).call();
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
