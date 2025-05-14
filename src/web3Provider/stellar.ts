import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import formatter from '../util/formatter';

const STELLAR_EXPERT_API = 'https://api.stellar.expert/explorer/public';
const STELLAR_HORIZON_API = 'https://horizon.stellar.org';
// Add delay function to prevent rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class Stellar {
  /**
   * Get balances for one or multiple Stellar contracts
   * @param addresses Single address or array of Stellar contract addresses
   * @returns Promise with array of token and balance pairs
   */
  async getContractsBalances(
    addresses: string | string[],
  ): Promise<{ token: string; balance: BigNumber }[]> {
    // Normalize input to array
    const addressArray = Array.isArray(addresses) ? addresses : [addresses];
    let results: { token: string; balance: BigNumber }[] = [];

    // Process each address sequentially
    for (const address of addressArray) {
      console.log('Processing address', address);
      const url = `${STELLAR_EXPERT_API}/contract/${address}/value`;

      const response = await fetch(url).then((res) => res.json());

      if (response.trustlines && Array.isArray(response.trustlines)) {
        const addressBalances = response.trustlines.map((line) => {
          // Use formatter utility to format asset names
          const normalizedAsset = formatter.formatStellarAddresses(line.asset);

          return {
            token: normalizedAsset,
            balance: new BigNumber(new BigNumber(line.balance).toString()),
          };
        });

        results = [...results, ...addressBalances];
      }

      if (addressArray.length > 1) {
        await delay(500);
      }
    }

    return results;
  }

  /**
   * Get balances for one or multiple Stellar accounts
   * @param accountIds Single account ID or array of Stellar account IDs
   * @returns Promise with array of token and balance pairs
   */
  async getAccountsBalances(
    accountIds: string | string[],
  ): Promise<{ token: string; balance: BigNumber }[]> {
    // Normalize input to array
    const accountIdArray = Array.isArray(accountIds)
      ? accountIds
      : [accountIds];
    let results: { token: string; balance: BigNumber }[] = [];

    // Process each account ID sequentially
    for (const accountId of accountIdArray) {
      console.log('Processing account', accountId);
      const url = `${STELLAR_HORIZON_API}/accounts/${accountId}`;

      try {
        const response = await fetch(url).then((res) => res.json());

        if (response.balances && Array.isArray(response.balances)) {
          const accountBalances = response.balances.map((balance) => {
            let asset;
            if (balance.asset_type === 'native') {
              asset = 'native';
            } else {
              asset = `${balance.asset_code}:${balance.asset_issuer}`;
            }

            // Use formatter utility to format asset names
            const normalizedAsset = formatter.formatStellarAddresses(asset);

            // Add 7 decimal places to the balance
            const balanceWithDecimals = new BigNumber(
              balance.balance,
            ).shiftedBy(7);

            return {
              token: normalizedAsset,
              balance: new BigNumber(balanceWithDecimals.toString()),
            };
          });

          results = [...results, ...accountBalances];
        }
      } catch (error) {
        console.error(`Error fetching account ${accountId}:`, error);
      }

      if (accountIdArray.length > 1) {
        await delay(500);
      }
    }

    return results;
  }

  /**
   * Get details for one or multiple Stellar liquidity pools
   * @param poolIds Single liquidity pool ID or array of IDs
   * @returns Promise with array of liquidity pool details
   */
  async getLiquidityPoolsBalances(poolIds: string | string[]): Promise<any[]> {
    // Normalize input to array
    const poolIdArray = Array.isArray(poolIds) ? poolIds : [poolIds];
    const results: any[] = [];

    // Process each pool ID sequentially
    for (const poolId of poolIdArray) {
      console.log('Processing liquidity pool', poolId);
      const url = `${STELLAR_HORIZON_API}/liquidity_pools/${poolId}`;

      try {
        const response = await fetch(url).then((res) => res.json());

        // Check if response contains expected data
        if (response.id && response.reserves) {
          // Process each reserve to truncate decimal parts and normalize asset names
          response.reserves = response.reserves.map((reserve) => {
            if (reserve.amount) {
              reserve.amount = reserve.amount.replace('.', '');
            }

            // Use formatter utility to format asset names
            reserve.asset = formatter.formatStellarAddresses(reserve.asset);

            return reserve;
          });

          results.push(response);
        }
      } catch (error) {
        console.error(`Error fetching liquidity pool ${poolId}:`, error);
      }

      if (poolIdArray.length > 1) {
        await delay(500);
      }
    }

    return results;
  }
}
