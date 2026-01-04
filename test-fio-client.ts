/**
 * Test script for FIO Bank API client
 *
 * Usage:
 *   FIO_API_TOKEN=your-token pnpm tsx test-fio-client.ts
 *   FIO_API_TOKEN=your-token pnpm tsx test-fio-client.ts 2024-12-01 2024-12-31
 */

import { getTransactions, FioApiError, debugGetRawResponse } from './src/fio-client.js';

async function main() {
  const token = process.env.FIO_API_TOKEN;
  if (!token) {
    console.error('Error: FIO_API_TOKEN environment variable is required');
    console.error('Usage: FIO_API_TOKEN=your-token pnpm tsx test-fio-client.ts [dateFrom] [dateTo]');
    process.exit(1);
  }

  // Default to last 30 days if no dates provided
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const dateFrom = process.argv[2] ?? thirtyDaysAgo.toISOString().split('T')[0];
  const dateTo = process.argv[3] ?? today.toISOString().split('T')[0];

  console.log(`Fetching transactions from ${dateFrom} to ${dateTo}...\n`);

  try {
    // Debug: show raw response structure
    if (process.argv.includes('--debug')) {
      const raw = await debugGetRawResponse(token, dateFrom!, dateTo!) as Record<string, unknown>;
      const stmt = raw.accountStatement as Record<string, unknown>;
      const txList = stmt?.transactionList as Record<string, unknown>;
      const transactions = txList?.transaction as Array<Record<string, unknown>>;
      if (transactions?.[0]) {
        console.log('=== Raw Transaction Sample ===');
        console.log(JSON.stringify(transactions[0], null, 2));
        console.log();
      }
      process.exit(0);
    }

    const result = await getTransactions(token, dateFrom!, dateTo!);

    console.log('=== Account Info ===');
    console.log(`Account: ${result.info.accountId}/${result.info.bankId}`);
    console.log(`IBAN: ${result.info.iban}`);
    console.log(`BIC: ${result.info.bic}`);
    console.log(`Currency: ${result.info.currency}`);
    console.log(`Opening Balance: ${result.info.openingBalance.toFixed(2)}`);
    console.log(`Closing Balance: ${result.info.closingBalance.toFixed(2)}`);
    console.log(`Period: ${result.info.dateStart} to ${result.info.dateEnd}`);

    console.log(`\n=== Transactions (${result.transactions.length}) ===\n`);

    for (const tx of result.transactions) {
      const sign = tx.amount >= 0 ? '+' : '';
      console.log(`${tx.date} | ${sign}${tx.amount.toFixed(2)} ${tx.currency}`);
      console.log(`  ID: ${tx.transactionId}`);
      if (tx.transactionType) console.log(`  Type: ${tx.transactionType}`);
      if (tx.counterAccount) {
        let counter = `  Counter: ${tx.counterAccount}`;
        if (tx.bankCode) counter += `/${tx.bankCode}`;
        if (tx.counterAccountName) counter += ` (${tx.counterAccountName})`;
        console.log(counter);
      }
      if (tx.variableSymbol) console.log(`  VS: ${tx.variableSymbol}`);
      if (tx.messageForRecipient) console.log(`  Message: ${tx.messageForRecipient}`);
      if (tx.comment) console.log(`  Comment: ${tx.comment}`);
      console.log();
    }

    console.log('=== Summary ===');
    console.log(`Total transactions: ${result.transactions.length}`);
    const income = result.transactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = result.transactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    console.log(`Total income: +${income.toFixed(2)} ${result.info.currency}`);
    console.log(`Total expenses: ${expenses.toFixed(2)} ${result.info.currency}`);

  } catch (error) {
    if (error instanceof FioApiError) {
      console.error(`FIO API Error (${error.statusCode}): ${error.message}`);
    } else {
      throw error;
    }
    process.exit(1);
  }
}

main();
