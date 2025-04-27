import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

// Pool addresses
const STABLES_POOL = '0xc90dB0d8713414d78523436dC347419164544A3f';
const FRAX_POOL = '0xa34315F1ef49392387Dd143f4578083A9Bd33E94';
const ATUST_POOL = '0x8fe44f5cce02D5BE44e3446bBc2e8132958d22B8';
const MAI_POOL = '0x65a761136815B45A9d78d9781d22d47247B49D23';
const VASE = '0xee793001Ce9Fa988712B15a59CCf5dC7d54b22FF';

// Token addresses
const DAI = '0xe3520349F477A5F6EB06107066048508498A291b';
const USDC = '0xb12bfca5a55806aaf64e99521918a4bf0fc40802';
const USDT = '0x4988a896b1227218e4a686fde5eabdcabd91571f';
const FRAX = '0xda2585430fef327ad8ee44af8f1f989a2a91a3d2';
const UST = '0x5ce9F0B6AFb36135b5ddBF11705cEB65E634A9dC';
const MAI = '0xdFA46478F9e5EA86d57387849598dbFB2e964b02';
const ROSE = '0xdcD6D4e2B3e1D1E1E6Fa8C21C8A323DcbecfF970';
const STROSE = '0xe23d2289FBca7De725DC21a13fC096787A85e16F';
const NEAR = '0xc42c30ac6cc15fac9bd938618bcaa1a1fae8501d';
const WETH = '0xC9BdeEd33CD01541e1eeD10f90519d2C06Fe3feB';
const WBTC = '0xf4eb217ba2454613b15dbdea6e5f22276410e89e';

const poolToTokensMap = {
  [STABLES_POOL]: [DAI, USDC, USDT],
  [FRAX_POOL]: [FRAX],
  [ATUST_POOL]: [UST],
  [MAI_POOL]: [MAI],
};

const gardenTokens = [NEAR, USDC, USDT, WETH, UST, WBTC];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};

  // Process pool tokens
  for (const [pool, tokens] of Object.entries(poolToTokensMap)) {
    const balanceResults = await util.getTokenBalances(
      pool,
      tokens,
      block,
      chain,
      web3,
    );
    formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);
  }

  // Process garden tokens in VASE
  const vaseBalanceResults = await util.getTokenBalances(
    VASE,
    gardenTokens,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, vaseBalanceResults, chain, provider);

  const stakingBalanceResults = await util.getTokenBalances(
    STROSE,
    [ROSE],
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, stakingBalanceResults, chain, provider);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
