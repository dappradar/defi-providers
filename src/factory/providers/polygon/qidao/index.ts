import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOLS = {
  '0x22965e296d9a0Cd0E917d6D70EF2573009F8a1bB':
    '0x1a13f4ca1d028320a707d99520abfefca3998b7f', //amUSDC
  '0xE6C23289Ba5A9F0Ef31b8EB36241D5c800889b7b':
    '0x27f8d03b3a2196956ed754badc28d73be8830a6e', //amDAI
  '0x0470CD31C8FcC42671465880BA81D631F0B76C1D':
    '0x28424507fefb6f7f8e9d3860f56504e4e5f5f390', //amWETH
  '0xB3911259f435b28EC072E4Ff6fF5A2C604fea0Fb':
    '0x60d55f02a771d515e077c9c2403a1ef324885cec', //amUSDT
  '0x7068Ea5255cb05931EFa8026Bd04b18F3DeB8b0B':
    '0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4', //amMATIC
  '0xeA4040B21cb68afb94889cB60834b13427CFc4EB':
    '0x1d2a0e5ec8e5bbdca5cb219e649b565d8e5c3360', //amAAVE
  '0xBa6273A78a23169e01317bd0f6338547F869E8Df':
    '0x5c2ed810328349100a66b82b78a1791b101c9d61', // amWBTC
  '0x947D711C25220d8301C087b25BA111FE8Cbf6672':
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  '0x3fd939B017b31eaADF9ae50C7fF7Fa5c0661d47C':
    '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', // weth
  '0x61167073E31b1DAd85a3E531211c7B8F1E5cAE72':
    '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39', // link
  '0x87ee36f780ae843A78D5735867bc1c13792b7b11':
    '0xd6df932a45c0f255f85145f286ea0b292b21c90b', // aave
  '0x98B5F32dd9670191568b661a3e847Ed764943875':
    '0x172370d5cd63279efa6d502dab29171933a610af', // crv
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 15164134) {
    return {};
  }

  const tokenBalances = {};

  const balanceResults = await util.getTokenBalancesOfHolders(
    Object.keys(POOLS),
    Object.keys(POOLS).map((pool) => POOLS[pool]),
    block,
    chain,
    web3,
  );
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
