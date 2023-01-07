import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import uniswapV2 from '../../../../util/calculators/uniswapV2';

const AURORA = '0x8bec47865ade3b172a928df8f990bc7f2a3b9f79';

// pool addresses
const stablesPool = '0xc90dB0d8713414d78523436dC347419164544A3f';
const fraxPool = '0xa34315F1ef49392387Dd143f4578083A9Bd33E94';
const atustPool = '0x8fe44f5cce02D5BE44e3446bBc2e8132958d22B8';
const maiPool = '0x65a761136815B45A9d78d9781d22d47247B49D23';
const rusdPool = '0x79B0a67a4045A7a8DC04b17456F4fe15339cBA34';

// token addresses
const DAI = '0xe3520349F477A5F6EB06107066048508498A291b';
const USDC = '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802';
const USDT = '0x4988a896b1227218e4A686fdE5EabdcAbd91571f';
const FRAX = '0xda2585430fef327ad8ee44af8f1f989a2a91a3d2';
const UST = '0x5ce9F0B6AFb36135b5ddBF11705cEB65E634A9dC';
const MAI = '0xdFA46478F9e5EA86d57387849598dbFB2e964b02';
const RUSD = '0x19cc40283B057D6608C22F1D20F17e16C245642E';
const ROSE = '0xdcD6D4e2B3e1D1E1E6Fa8C21C8A323DcbecfF970';
const STROSE = '0xe23d2289FBca7De725DC21a13fC096787A85e16F';

const VASE = '0xee793001Ce9Fa988712B15a59CCf5dC7d54b22FF';

// pool to underlying tokens map
const STABLE_POOLS = {
  [stablesPool]: [DAI, USDC, USDT],
  [fraxPool]: [FRAX],
  [atustPool]: [UST],
  [maiPool]: [MAI],
  [rusdPool]: [RUSD],
};

const POOL_ADDRESSES = [stablesPool, fraxPool, atustPool, maiPool, rusdPool];
const POOL_TOKENS = [DAI, USDC, USDT, FRAX, UST, MAI, RUSD];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 54501517) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    VASE,
    block,
    chain,
    provider,
    web3,
  );

  const stablePoolsBalances = await util.getTokenBalancesOfEachHolder(
    POOL_ADDRESSES,
    POOL_TOKENS,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, stablePoolsBalances);
  const balanceResults = await util.getTokenBalances(
    STROSE,
    [ROSE],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

export { tvl };
