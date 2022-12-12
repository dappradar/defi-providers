import { Connection, PublicKey } from '@solana/web3.js';

const MSOL_LP_SOL = new PublicKey(
  'UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q',
);
const MSOL_LP_MSOL = new PublicKey(
  '7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE',
);
const MSOL_LP_MINT = new PublicKey(
  'LPmSozJJ8Jh69ut2WP3XmVohTjL4ipR18yiCzxrUmVj',
);

// accountsArray is an array of base58 address strings
async function getMultipleAccountsRaw(accountsArray, web3) {
  if (
    !Array.isArray(accountsArray) ||
    accountsArray.length === 0 ||
    typeof accountsArray[0] !== 'string'
  ) {
    throw new Error('Expected accountsArray to be an array of strings');
  }

  const accountsInfo = await web3.call('getMultipleAccounts', [accountsArray]);

  return accountsInfo.value;
}

// Gets data in Buffers of all addresses, while preserving labels
// Example: labeledAddresses = { descriptiveLabel: "9xDUcgo8S6DdRjvrR6ULQ2zpgqota8ym1a4tvxiv2dH8", ... }
async function getMultipleAccountBuffers(labeledAddresses, web3) {
  const labels = [];
  const addresses = [];

  for (const [label, address] of Object.entries(labeledAddresses)) {
    labels.push(label);
    addresses.push(address);
  }
  const accountsData = await getMultipleAccountsRaw(addresses, web3);

  const results = {
    msolTokens: null,
    poolMint: null,
    tokenAReserve: null,
    tokenBReserve: null,
  };
  accountsData.forEach((account, index) => {
    if (account === null) {
      results[labels[index]] = null;
    } else {
      results[labels[index]] = Buffer.from(account.data[0], account.data[1]);
    }
  });

  return results;
}

const getMSolLPTokens = async (lpAmount, web3) => {
  const connection = new Connection(web3.nodeUrl);
  const accountData = await getMultipleAccountBuffers(
    {
      msolTokens: MSOL_LP_MSOL.toString(),
      poolMint: MSOL_LP_MINT.toString(),
    },
    web3,
  );

  const solAmount = (await connection.getAccountInfo(MSOL_LP_SOL)).lamports;
  const msolAmount = Number(accountData.msolTokens.readBigUInt64LE(64));
  const lpSupply = Number(accountData.poolMint.readBigUInt64LE(4 + 32));

  return {
    msol: (msolAmount * lpAmount) / lpSupply,
    solana: (solAmount * lpAmount) / lpSupply,
  };
};

export { MSOL_LP_MINT, getMSolLPTokens, getMultipleAccountBuffers };
