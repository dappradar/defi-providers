import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

async function getTokenBalance(address, account, web3) {
  const contract = new web3.eth.Contract(null, address);
  try {
    return await contract.methods.balanceOf(account).call();
  } catch {
    return 0;
  }
}

async function getTotalSupply(account, web3) {
  try {
    const tokenBalance = await web3.call('getTokenSupply', [account]);
    return tokenBalance.value.amount;
  } catch {
    return 0;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};
  const [
    usdcEarn,
    btcSbrEarn,
    solMerPai,
    usdTriEarn,
    usdcUstSbrEarn,
    solprtSbrEarn,
    usdcRayEarn,
    solPai,
    solPsol,
    btcRenP,
    btcRenPai,
    srmPai,
    usdtPai,
    solPrtP,
    usdcPbtc,
    usdcUsdtSbrEarn,
    solRayEarn,
    usdcPai,
    btcPbtc,
    solmSbrEarn,
    // invested
    iUsdcEarn,
    iSbrBtcEarn1,
    iSbrBtcEarn2,
    iMerTriUsdEarn1,
    iMerTriUsdEarn2,
    iMerUsdcUsdtPai,
    iSbrUsdcUsdtEarn1,
    iSbrUsdcUsdtEarn2,
    iSbrUsdcUsdtEarn3,
    iSbrUstUsdcEarn1,
    iSbrUstUsdcEarn2,
    iSbrUstUsdcEarn,
    iSbrMSolSolEarn1,
    iSbrMSolSolEarn2,
    iSabPrtSolSolEarn1,
    iSabPrtSolSolEarn2,
    // staked
    sPoolSupplySol,
  ] = await Promise.all([
    //getTokenBalance('mint', 'vaultTypePDA') https://doc.parrot.fi/security/inspect.html

    //USDC:PAI+EARN YES
    getTokenBalance(
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'AjExAjiLEDLLka42n1biVs5akE5qJ6gNTHH8JKByxW4h',
      web3,
    ),
    //SBR LP (BTC-renBTC):pBTC+EARN YES
    getTokenBalance(
      'SLPbsNrLHv8xG4cTc4R5Ci8kB9wUPs6yn6f7cKosoxs',
      'Cz5G4RkGdEFN4BACZHJnTW67GUcVzdSi4jAH2E173pkK',
      web3,
    ),
    //MER LP (pSOL-SOL):PAI NO
    getTokenBalance(
      'GHhDU9Y7HM37v6cQyaie1A3aZdfpCDp6ScJ5zZn2c3uk',
      'nkNjtZMzxhFsb3hEWvA5cvsX1otTrKkTd1DnS177bd3',
      web3,
    ),
    //MER LP (USDC-USDT-UST):PAI+EARN NO
    getTokenBalance(
      '57h4LEnBooHrKbacYWGCFghmrTzYPVn8PwZkzTzRLvHa',
      '6EnWVbLNijTPNQEy73MvkPcDeyEvChiKeMY2aVvMtvkC',
      web3,
    ),

    //SBR LP (UST-USDC):PAI+EARN NO
    getTokenBalance(
      'UST32f2JtPGocLzsL41B3VBBoJzTm1mK1j3rwyM3Wgc',
      '9zJi3M2wWeafjt9eyPh9iGNovuFeM4xrdtzen1sKSjeb',
      web3,
    ),
    //SBR LP (prtSOL-SOL):pSOL+EARN NO
    getTokenBalance(
      'PrsVdKtXDDf6kJQu5Ff6YqmjfE4TZXtBgHM4bjuvRnR',
      '9jCNEAn4PUNwGvpQikHjt1Udv1z58gf1Yb5x5bmE7y1k',
      web3,
    ),
    //RAY LP (MER-USDC):PAI+EARN NO
    getTokenBalance(
      '3H9NxvaZoxMZZDZcbBDdWMKbrfNj7PCF5sbRwDr7SdDW',
      '5xbHeB7BS7YJAChLamfdeFna5HPxj481KQrymxJnH4S2',
      web3,
    ),
    //wSOL:PAI
    getTokenBalance(
      'So11111111111111111111111111111111111111112',
      '62Xb5ydBN1vrkg85SuKEL6aPv4bsy6iTiH3Jvki8NfNr',
      web3,
    ),
    //mSOL:pSOL
    getTokenBalance(
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
      'GJU8CWPYSg6Zu4jpMN9M9JSxaftm54NjpZe6QPtiVeXK',
      web3,
    ),

    //renBTC:pBTC btcrenp
    getTokenBalance(
      'CDJWUqTcYTVAKXAVXoQZFes5JUFc7owSeq7eMQcDSbo5',
      '6HE83GFg4odsntioHrNrWHyyBeJR1644c3b2yLNV8LDN',
      web3,
    ),
    //renBTC:PAI btcrenPai
    getTokenBalance(
      'CDJWUqTcYTVAKXAVXoQZFes5JUFc7owSeq7eMQcDSbo5',
      '7Efka6Lp7i1zUdQxwCpVpCKkiU52t9HR8QULir3K6oBe',
      web3,
    ),
    //SRM:PAI
    getTokenBalance(
      'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
      'q96RZiNkec9PAfLtgrJaGLvXSK9fxs4DQ1g6RbiSvJg',
      web3,
    ),
    //USDT:PAI
    getTokenBalance(
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'DGi3TxcKUq3E5t1mL33n9jRgdWWKngeRkP3fUppG4inn',
      web3,
    ),
    //prtSOL:pSOL
    getTokenBalance(
      'BdZPG9xWrG3uFrx2KrUW1jT4tZ9VKPDWknYihzoPRJS3',
      'tjXrYz2USzesD9YUXWoW8UJRAmkQ3dwSmzfYDN6bifk',
      web3,
    ),

    //USDC:pBTC
    getTokenBalance(
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'DQV7nFUWKSsiT7eWPhfGhdiRFsU1DmnEYgbFGKuPPsMs',
      web3,
    ),
    //SBR LP (USDC-USDT):PAI+EARN
    getTokenBalance(
      '2poo1w1DL6yd2WNTCnNTzDqkC6MBXq7axo77P16yrBuf',
      'AvfKigSXwRKXNQ9PTeUDWQnMdZWz2j6oH569t96S1Md5',
      web3,
    ),
    //RAY LP (SOL-USDC):PAI+EARN
    getTokenBalance(
      '8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu',
      '4zTNPK46rsRNRCpbkGChBaEZZYYMoZ7YaBEn51yfBHuW',
      web3,
    ),
    //USDC:PAI
    getTokenBalance(
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'DefDiDiauGqS8ZUiHHuRCpmt8XZPGTTp6DY7UQP5NkkP',
      web3,
    ),
    //BTC (sollet):pBTC
    getTokenBalance(
      '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
      'CkgNPPZasMZJyNsefrTGgG8shZ87W1CAcXCHjhjwAEUW',
      web3,
    ),

    //SBR LP (mSOL-SOL):pSOL+EARN
    getTokenBalance(
      'SoLEao8wTzSfqhuou8rcYsVoLjthVmiXuEjzdNPMnCz',
      'A8gtS5FV2UgjCjKxAEPm6aCXjPQaaeiZJKeGJnR1adCs',
      web3,
    ),

    // ----- INVESTED VAULTS -----

    // USDC:PAI+EARN
    getTokenBalance(
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'E82ho9Mc1xKmL6aPpDneFMobDywiRM5PuPa7AMcEhofw',
      web3,
    ),
    // SBR LP (BTC-renBTC):pBTC+Earn (1)
    getTokenBalance(
      'SLPbsNrLHv8xG4cTc4R5Ci8kB9wUPs6yn6f7cKosoxs',
      'Gmzr6b6iPWKvWQtCmqL9yB6hYGec8Rv3XksmMT2VThDg',
      web3,
    ),
    // SBR LP (BTC-renBTC):pBTC+Earn (2: sunny)
    getTokenBalance(
      '9Re318zAqN2VxT9fELUJxhJkZ7zyEhLXMxW4gCoxqbwc',
      'HU6JgiEGGzPCMHXbJbuNTNniTDUkHntMML9PJZLrJttT',
      web3,
    ),
    // MER LP (USDC-USDT-UST):PAI+Earn (1)
    getTokenBalance(
      '57h4LEnBooHrKbacYWGCFghmrTzYPVn8PwZkzTzRLvHa',
      'E82ho9Mc1xKmL6aPpDneFMobDywiRM5PuPa7AMcEhofw',
      web3,
    ),
    // MER LP (USDC-USDT-UST):PAI+Earn (2)
    getTokenBalance(
      '57h4LEnBooHrKbacYWGCFghmrTzYPVn8PwZkzTzRLvHa',
      '4Xjmy2UMdj6WsHHpUUw7bZJWbusyPNYj3aNQMJa4ayxT',
      web3,
    ),
    // MER LP (USDC-USDT-PAI)
    getTokenBalance(
      '9s6dXtMgV5E6v3rHqBF2LejHcA2GWoZb7xNUkgXgsBqt',
      'E82ho9Mc1xKmL6aPpDneFMobDywiRM5PuPa7AMcEhofw',
      web3,
    ),
    // SBR LP (USDC-USDT):PAI+Earn (1)
    getTokenBalance(
      '2poo1w1DL6yd2WNTCnNTzDqkC6MBXq7axo77P16yrBuf',
      'BLzKZp83pw6ESC7Ks19uUMce81HEthMWonavsYFRKxvE',
      web3,
    ),
    // SBR LP (USDC-USDT):PAI+Earn (2)
    getTokenBalance(
      '2poo1w1DL6yd2WNTCnNTzDqkC6MBXq7axo77P16yrBuf',
      '9mazCmauvJ1bz8whGG6XF7jFCvdJz6r7n24kHkQyei8w',
      web3,
    ),
    // SBR LP (USDC-USDT):PAI+Earn (3: sunny)
    getTokenBalance(
      'DtYJRBbkHbSP1H8Gc3iAAEeBWfm3cPHqQqRW8Xrmu5xs',
      '4S7KVrXcQiF8Y23swSVpodzyLrruKhQ6mou62mdv2hHg',
      web3,
    ),
    // SBR LP (UST-USDC):PAI+Earn (1)
    getTokenBalance(
      'UST32f2JtPGocLzsL41B3VBBoJzTm1mK1j3rwyM3Wgc',
      'HSaGLKsiHDGUbXZRNrQ9R6WWmxjtoKZToSCUgcxpiuNj',
      web3,
    ),
    // SBR LP (UST-USDC):PAI+Earn (2)
    getTokenBalance(
      'UST32f2JtPGocLzsL41B3VBBoJzTm1mK1j3rwyM3Wgc',
      'CsmHqWmq5KHNpQ6YkffiByqdp23zphHqN27orXb1gkye',
      web3,
    ),
    // SBR LP (UST-USDC):PAI+Earn (3: sunny)
    getTokenBalance(
      'HoSvqUMwQsiHbykioLW4Wu1BgFB34kSVByW223ACqDz3',
      '9V5NgpvTSd4JbiWLY3EupiZVTZDJK6Q1JWwkfob5kJP1',
      web3,
    ),
    // SBR LP (mSOL-SOL):pSOL+Earn (1)
    getTokenBalance(
      'SoLEao8wTzSfqhuou8rcYsVoLjthVmiXuEjzdNPMnCz',
      '4iP8x3kMB3TJGhtpkng17wdHXyo4jj99K1N2Bk6mu3pW',
      web3,
    ),
    // SBR LP (mSOL-SOL):pSOL+Earn (2: sunny)
    getTokenBalance(
      '3SfwMcnxtQQCM83ADxcp3VoTriLrL1WueuKZmuquTLiz',
      '7yN3Nx9QUThQFXnQdYGuYj1VypyzAdbRnHUFKgVoGyye',
      web3,
    ),
    // SBR LP (prtSOL-SOL):pSOL+Earn (1)
    getTokenBalance(
      'PrsVdKtXDDf6kJQu5Ff6YqmjfE4TZXtBgHM4bjuvRnR',
      'B2MadbQ6LmdKo1fCz4cbbuXKDMtzRmZZPSCCUUJfApmb',
      web3,
    ),
    // SBR LP (prtSOL-SOL):pSOL+Earn (2: sunny)
    getTokenBalance(
      'CNE9khSS1NdgP3Uf7woYKsCDrohgVpigfvDkCg2CqtC7',
      'FB81RMPyPtFQ1xb25RdBof8xBgtMVVXcfGBg8fWUwgyz',
      web3,
    ),

    // Stake pool total supply
    getTotalSupply('BdZPG9xWrG3uFrx2KrUW1jT4tZ9VKPDWknYihzoPRJS3', web3),
  ]);

  const usd_coin = BigNumber(usdcEarn)
    .plus(usdcPbtc)
    .plus(usdcPai)
    .plus(usdcUstSbrEarn)
    .plus(Number(usdTriEarn) / 3)
    .plus(iUsdcEarn)
    .plus(Number(iMerTriUsdEarn1) / 3)
    .plus(Number(iMerTriUsdEarn2) / 3)
    .plus(Number(iSbrUsdcUsdtEarn1) / 2)
    .plus(Number(iSbrUsdcUsdtEarn2) / 2)
    .plus(Number(iSbrUsdcUsdtEarn3) / 2)
    .plus(Number(iSbrUstUsdcEarn1) / 2)
    .plus(Number(iSbrUstUsdcEarn2) / 2)
    .plus(Number(iMerUsdcUsdtPai) / 3)
    .plus(Number(iSbrUstUsdcEarn) / 2);

  const terrausd = BigNumber(usdcUstSbrEarn)
    .plus(Number(usdTriEarn) / 3)
    .plus(Number(iMerTriUsdEarn1) / 3)
    .plus(Number(iMerTriUsdEarn2) / 3)
    .plus(Number(iSbrUstUsdcEarn1) / 2)
    .plus(Number(iSbrUstUsdcEarn2) / 2)
    .plus(Number(iSbrUstUsdcEarn) / 2);
  const tether = BigNumber(usdtPai)
    .plus(usdcUsdtSbrEarn)
    .plus(Number(usdTriEarn) / 3)
    .plus(Number(iMerTriUsdEarn1) / 3)
    .plus(Number(iMerTriUsdEarn2) / 3)
    .plus(Number(iSbrUsdcUsdtEarn1) / 2)
    .plus(Number(iSbrUsdcUsdtEarn2) / 2)
    .plus(Number(iSbrUsdcUsdtEarn3) / 2);
  const solana = BigNumber(solPai)
    .plus(solPrtP)
    .plus(solPsol)
    .plus(solmSbrEarn)
    .plus(solprtSbrEarn)
    .plus(solRayEarn)
    .plus(solMerPai)
    .plus(iSbrMSolSolEarn1)
    .plus(iSbrMSolSolEarn2)
    .plus(iSabPrtSolSolEarn1)
    .plus(iSabPrtSolSolEarn2)
    .plus(sPoolSupplySol);

  const serum = BigNumber(srmPai);
  const renbtc = BigNumber(btcRenP).plus(btcRenPai);
  const bitcoin = BigNumber(btcPbtc)
    .plus(Number(btcSbrEarn) / 10 ** 2) //Divided by 2 decimal places as thats difference between the decimal places of btc(sollet) and Saber BTC-renBTC LP
    .plus(iSbrBtcEarn1)
    .plus(iSbrBtcEarn2);

  balances['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'] = usd_coin;
  balances['9vMJfxuKxXBoEa7rM12mYLMwTacLMLDJqHozw96WQL8i'] = terrausd;
  balances['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'] = tether;
  balances['So11111111111111111111111111111111111111112'] = solana;
  balances['SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt'] = serum;
  balances['CDJWUqTcYTVAKXAVXoQZFes5JUFc7owSeq7eMQcDSbo5'] = renbtc;
  balances['9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E'] = bitcoin;

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
