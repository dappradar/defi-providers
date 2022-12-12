import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import { Connection, PublicKey } from '@solana/web3.js';
import { Coder } from '@project-serum/anchor';
import QuarryMineIDL from './quarry_mine.json';
import {
  getMultipleAccountBuffers,
  getMSolLPTokens,
  MSOL_LP_MINT,
} from './msolLP';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const MINT_URL =
  'https://raw.githubusercontent.com/QuarryProtocol/rewarder-list-build/master/mainnet-beta/tvl.json';
const SABER_URL = 'https://registry.saber.so/data/llama.mainnet.json';
let quarriesByStakedMint, coingeckoIDs, saberPools;

const readTVL = async ({
  tokenA,
  tokenB,
  tokenAReserve,
  tokenBReserve,
  poolMint,
  tokenAmount,
  web3,
}) => {
  const accountData = await getMultipleAccountBuffers(
    {
      tokenAReserve,
      tokenBReserve,
      poolMint,
    },
    web3,
  );

  const decimals = accountData.poolMint.readUInt8(44);
  const divisor = 10 ** decimals;

  const lpTokenTotalSupply = Number(accountData.poolMint.readBigUInt64LE(36));
  const poolShare = (tokenAmount * divisor) / lpTokenTotalSupply;

  const reserveAAmount =
    Number(accountData.tokenAReserve.readBigUInt64LE(64)) / divisor;
  const reserveBAmount =
    Number(accountData.tokenBReserve.readBigUInt64LE(64)) / divisor;

  const poolTvlCoins = {};

  if (tokenA == tokenB) {
    poolTvlCoins[tokenA] =
      poolShare * reserveAAmount + poolShare * reserveBAmount;
  } else {
    poolTvlCoins[tokenA] = poolShare * reserveAAmount;
    poolTvlCoins[tokenB] = poolShare * reserveBAmount;
  }

  return poolTvlCoins;
};

async function getBalance(connection, coder, stakedMint, quarryKeys, web3) {
  try {
    const coingeckoID = coingeckoIDs[stakedMint];
    const saberPool = coingeckoID
      ? null
      : saberPools.find((p) => p.lpMint == stakedMint);
    const isMsolSolLP = stakedMint == MSOL_LP_MINT.toString();

    if (!coingeckoID && !saberPool && !isMsolSolLP) {
      return [];
    }

    const quarriesRaw = await connection.getMultipleAccountsInfo(
      quarryKeys.map((q) => new PublicKey(q)),
    );
    const quarries = quarriesRaw.map((q) =>
      coder.accounts.decode('Quarry', q.data),
    );
    const totalTokens = quarries.reduce(
      (sum, q) =>
        sum +
        parseFloat(q.totalTokensDeposited.toString()) /
          10 ** q.tokenMintDecimals,
      0,
    );

    const balances = [];
    if (coingeckoID) {
      balances.push({
        token: `coingecko_${coingeckoID}`,
        balance: totalTokens,
      });
    } else if (saberPool) {
      const quarryTVL = await readTVL({
        tokenA: saberPool.tokenACoingecko,
        tokenB: saberPool.tokenBCoingecko,
        tokenAReserve: saberPool.reserveA,
        tokenBReserve: saberPool.reserveB,
        poolMint: stakedMint,
        tokenAmount: totalTokens,
        web3,
      });

      for (const [tokenId, amount] of Object.entries(quarryTVL)) {
        if (tokenId == 'cashio-dollar') {
          balances.push({
            token: 'CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT',
            balance: amount,
          });
        } else {
          balances.push({
            token: `coingecko_${tokenId}`,
            balance: amount,
          });
        }
      }
    } else if (isMsolSolLP) {
      const msolTVL = await getMSolLPTokens(totalTokens, web3);
      for (const [tokenId, amount] of Object.entries(msolTVL)) {
        if (tokenId == 'cashio-dollar') {
          balances.push({
            token: 'CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT',
            balance: amount,
          });
        } else {
          balances.push({
            token: `coingecko_${tokenId}`,
            balance: amount,
          });
        }
      }
    }

    return balances;
  } catch {
    return [];
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  // this is a mapping of token mint to list of quarries
  // more details: https://github.com/QuarryProtocol/rewarder-list
  const data = await fetch(MINT_URL).then((res) => res.json());
  quarriesByStakedMint = data.quarriesByStakedMint;
  coingeckoIDs = data.coingeckoIDs;

  saberPools = await fetch(SABER_URL).then((res) => res.json());

  const connection = new Connection(web3.eth.getNodeUrl());
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const coder = new Coder(QuarryMineIDL);

  const quarryStakedMints = Object.keys(quarriesByStakedMint);
  const mintLength = quarryStakedMints.length;
  const balances = {};

  for (let i = 0; i < mintLength; i += 20) {
    const stakedMints = quarryStakedMints.slice(i, i + 20);
    const balanceResults = await Promise.all(
      stakedMints.map((mint) =>
        getBalance(connection, coder, mint, quarriesByStakedMint[mint], web3),
      ),
    );
    balanceResults.forEach((results) => {
      results.forEach((result) => {
        if (!balances[result.token]) {
          balances[result.token] = result.balance.toString();
        } else {
          balances[result.token] = BigNumber(balances[result.token])
            .plus(result.balance)
            .toFixed();
        }
      });
    });
  }
  return { balances };
}

export { tvl };
