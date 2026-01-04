#!/usr/bin/env node

/**
 * FIO Bank MCP Server
 * https://www.fio.cz/docs/cz/API_Bankovnictvi.pdf
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { getTransactions, FioApiError } from './fio-client.js';
import type { AccountStatement } from './types.js';

const FIO_API_TOKEN = process.env.FIO_API_TOKEN;

function getToken(providedToken?: string): string {
  const token = providedToken ?? FIO_API_TOKEN;
  if (!token) {
    throw new Error(
      'No API token. Pass token parameter or set FIO_API_TOKEN env var.'
    );
  }
  return token;
}

function formatStatement(statement: AccountStatement): string {
  const { info, transactions } = statement;

  let result = `## Account: ${info.accountId}/${info.bankId}\n`;
  result += `IBAN: ${info.iban} | BIC: ${info.bic}\n`;
  result += `Balance: ${info.openingBalance.toFixed(2)} → ${info.closingBalance.toFixed(2)} ${info.currency}\n`;

  if (info.dateStart && info.dateEnd) {
    result += `Period: ${info.dateStart} to ${info.dateEnd}\n`;
  }

  if (transactions.length === 0) {
    result += `\nNo transactions found.\n`;
    return result;
  }

  result += `\n## Transactions (${transactions.length})\n\n`;

  for (const tx of transactions) {
    const sign = tx.amount >= 0 ? '+' : '';
    result += `**${tx.date}** | ${sign}${tx.amount.toFixed(2)} ${tx.currency}\n`;
    result += `ID: ${tx.transactionId}`;
    if (tx.transactionType) result += ` | ${tx.transactionType}`;
    result += `\n`;

    if (tx.counterAccount) {
      result += `Counter: ${tx.counterAccount}`;
      if (tx.bankCode) result += `/${tx.bankCode}`;
      if (tx.counterAccountName) result += ` (${tx.counterAccountName})`;
      result += `\n`;
    }

    const symbols = [
      tx.variableSymbol && `VS:${tx.variableSymbol}`,
      tx.constantSymbol && `KS:${tx.constantSymbol}`,
      tx.specificSymbol && `SS:${tx.specificSymbol}`,
    ].filter(Boolean);
    if (symbols.length) result += `Symbols: ${symbols.join(' ')}\n`;

    if (tx.messageForRecipient) result += `Message: ${tx.messageForRecipient}\n`;
    if (tx.comment) result += `Comment: ${tx.comment}\n`;

    result += `\n`;
  }

  return result;
}

const server = new McpServer({ name: 'fio-bank-mcp', version: '1.0.0' });

server.registerTool(
  'fio_get_transactions',
  {
    description: `Get account transactions for a date range from FIO Bank.

Returns account info (IBAN, BIC, balance) and transactions with:
- Transaction ID, date, amount, currency
- Counter account (number, name, bank)
- Payment symbols (variable, constant, specific)
- Message, comments, transaction type

Rate limit: 1 request per 30 seconds.
Data older than 90 days requires unlock in internet banking.`,
    inputSchema: {
      token: z
        .string()
        .optional()
        .describe('FIO API token (64 chars). Optional if FIO_API_TOKEN env var is set.'),
      dateFrom: z.string().describe('Start date (YYYY-MM-DD)'),
      dateTo: z.string().describe('End date (YYYY-MM-DD)'),
    },
  },
  async ({ token, dateFrom, dateTo }) => {
    try {
      const apiToken = getToken(token);
      const result = await getTransactions(apiToken, dateFrom, dateTo);

      return {
        content: [{ type: 'text', text: formatStatement(result) }],
      };
    } catch (error) {
      if (error instanceof FioApiError) {
        return {
          content: [
            { type: 'text', text: `FIO API Error (${error.statusCode}): ${error.message}` },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('FIO Bank MCP Server running');
}

main().catch(console.error);
