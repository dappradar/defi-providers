import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const POOLS = [
  {
    token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    address: '2dc3UgMuVkASzW4sABDjDB5PjFbPTncyECUnZL73bmQR',
  },
  {
    token: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    address: '2dc3UgMuVkASzW4sABDjDB5PjFbPTncyECUnZL73bmQR',
  },
  {
    token: 'Ea5SjE2Y6yvCeW5dYTn7PYMuW5ikXkvbGdcmSnXeaLjS',
    address: '2dc3UgMuVkASzW4sABDjDB5PjFbPTncyECUnZL73bmQR',
  },
  {
    token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    address: 'FDonWCo5RJhx8rzSwtToUXiLEL7dAqLmUhnyH76F888D',
  },
  {
    token: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    address: 'FDonWCo5RJhx8rzSwtToUXiLEL7dAqLmUhnyH76F888D',
  },
  {
    token: 'CXLBjMMcwkc17GfJtBos6rQCo1ypeH6eDbB82Kby4MRm',
    address: 'FDonWCo5RJhx8rzSwtToUXiLEL7dAqLmUhnyH76F888D',
  },
  {
    token: 'So11111111111111111111111111111111111111112',
    address: '8RXqdSRFGLX8iifT2Cu5gD3fG7G4XcEBWCk9X5JejpG3',
  },
  {
    token: '9EaLkQrbjmbbuZG9Wdpo8qfNUEjHATJFSycEmw6f1rGX',
    address: '8RXqdSRFGLX8iifT2Cu5gD3fG7G4XcEBWCk9X5JejpG3',
  },
  {
    token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    address: '3m15qNJDM5zydsYNJzkFYXE7iGCVnkKz1mrmbawrDUAH',
  },
  {
    token: 'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM',
    address: '3m15qNJDM5zydsYNJzkFYXE7iGCVnkKz1mrmbawrDUAH',
  },
  {
    token: 'Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1',
    address: '3m15qNJDM5zydsYNJzkFYXE7iGCVnkKz1mrmbawrDUAH',
  },
  {
    token: 'EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCWNWqxWV4J6o',
    address: '3m15qNJDM5zydsYNJzkFYXE7iGCVnkKz1mrmbawrDUAH',
  },
  {
    token: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
    address: 'pG6noYMPVR9ykNgD4XSNa6paKKGGwciU2LckEQPDoSW',
  },
  {
    token: 'So11111111111111111111111111111111111111112',
    address: 'pG6noYMPVR9ykNgD4XSNa6paKKGGwciU2LckEQPDoSW',
  },
  {
    token: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    address: 'GM48qFn8rnqhyNMrBHyPJgUVwXQ1JvMbcu3b9zkThW9L',
  },
  {
    token: 'So11111111111111111111111111111111111111112',
    address: 'EWy2hPdVT4uGrYokx65nAyn2GFBv7bUYA2pFPY96pw7Y',
  },
];

async function getTokenBalance(address, account, web3) {
  try {
    const contract = new web3.eth.Contract(null, address);
    const balance = await contract.methods.balanceOf(account).call();
    return {
      token: address,
      balance: BigNumber(balance),
    };
  } catch {
    null;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3, chain, provider } = params;
  const tokenBalances = await Promise.all(
    POOLS.map((pool) => getTokenBalance(pool.token, pool.address, web3)),
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
