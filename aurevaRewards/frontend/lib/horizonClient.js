import { Horizon } from 'stellar-sdk';

const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';

const ISSUER_PUBLIC = process.env.NEXT_PUBLIC_ISSUER_PUBLIC;

const server = new Horizon.Server(HORIZON_URL, { timeout: 15000 });

/**
 * Fetches the current AUR token balance for a wallet.
 * Returns '0' if the account has no AUR trustline.
 * Requirements: 8.3
 *
 * @param {string} walletAddress - Stellar public key
 * @returns {Promise<string>} AUR balance string
 */
export async function getAURBalance(walletAddress) {
  try {
    const account = await server.loadAccount(walletAddress);
    const aurBalance = account.balances.find(
      (b) =>
        b.asset_type !== 'native' &&
        b.asset_code === 'AUR' &&
        b.asset_issuer === ISSUER_PUBLIC
    );
    return aurBalance ? aurBalance.balance : '0';
  } catch (err) {
    if (err.response?.status === 404) return '0';
    throw err;
  }
}

/**
 * Fetches the full AUR transaction history for a wallet from Horizon.
 * Handles cursor-based pagination to retrieve all records (up to 500).
 * Requirements: 6.1, 6.4
 *
 * @param {string} walletAddress - Stellar public key
 * @returns {Promise<object[]>} Array of payment records
 */
export async function getTransactionHistory(walletAddress) {
  const transactions = [];

  try {
    let page = await server
      .payments()
      .forAccount(walletAddress)
      .order('desc')
      .limit(100)
      .call();

    while (page.records.length > 0) {
      const aurPayments = page.records.filter(
        (r) =>
          r.type === 'payment' &&
          r.asset_code === 'AUR' &&
          r.asset_issuer === ISSUER_PUBLIC
      );
      transactions.push(...aurPayments);
      if (transactions.length >= 500) break;
      page = await page.next();
    }
  } catch (err) {
    // Account not found — return empty history
    if (err.response?.status === 404) return [];
    throw err;
  }

  return transactions;
}
