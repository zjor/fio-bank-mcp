/**
 * FIO Bank API Client
 * https://www.fio.cz/docs/cz/API_Bankovnictvi.pdf
 */

import type {
  AccountStatement,
  Transaction,
  AccountInfo,
  FioApiResponse,
} from './types.js';

const BASE_URL = 'https://fioapi.fio.cz/v1/rest';

// Rate limiting: 1 request per 30 seconds per token
const RATE_LIMIT_MS = 30000;
const lastRequestTime = new Map<string, number>();

export class FioApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'FioApiError';
  }
}

async function checkRateLimit(token: string): Promise<void> {
  const lastRequest = lastRequestTime.get(token);
  if (lastRequest) {
    const elapsed = Date.now() - lastRequest;
    if (elapsed < RATE_LIMIT_MS) {
      const waitTime = RATE_LIMIT_MS - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  lastRequestTime.set(token, Date.now());
}

function parseDate(dateStr: string): string {
  // Remove timezone offset (e.g., "2024-01-15+01:00" -> "2024-01-15")
  return dateStr.split('+')[0] ?? dateStr;
}

function parseResponse(data: FioApiResponse): AccountStatement {
  const { info, transactionList } = data.accountStatement;

  const accountInfo: AccountInfo = {
    accountId: info.accountId,
    bankId: info.bankId,
    currency: info.currency,
    iban: info.iban,
    bic: info.bic,
    openingBalance: info.openingBalance,
    closingBalance: info.closingBalance,
    dateStart: info.dateStart ? parseDate(info.dateStart) : undefined,
    dateEnd: info.dateEnd ? parseDate(info.dateEnd) : undefined,
    idFrom: info.idFrom,
    idTo: info.idTo,
  };

  const transactions: Transaction[] = [];

  if (transactionList?.transaction) {
    for (const tx of transactionList.transaction) {
      transactions.push({
        transactionId: tx.column22?.value?.toString() ?? '',
        date: tx.column0?.value ? parseDate(tx.column0.value) : '',
        amount: tx.column1?.value ?? 0,
        currency: tx.column14?.value ?? '',
        counterAccount: tx.column2?.value ?? undefined,
        counterAccountName: tx.column10?.value || undefined,
        bankCode: tx.column3?.value ?? undefined,
        bankName: tx.column12?.value ?? undefined,
        constantSymbol: tx.column4?.value ?? undefined,
        variableSymbol: tx.column5?.value ?? undefined,
        specificSymbol: tx.column6?.value ?? undefined,
        userIdentification: tx.column7?.value ?? undefined,
        messageForRecipient: tx.column16?.value ?? undefined,
        transactionType: tx.column8?.value ?? undefined,
        performer: tx.column9?.value ?? undefined,
        specification: tx.column18?.value ?? undefined,
        comment: tx.column25?.value ?? undefined,
        bic: tx.column26?.value ?? undefined,
        orderId: tx.column17?.value ?? undefined,
        payerReference: tx.column27?.value ?? undefined,
      });
    }
  }

  return { info: accountInfo, transactions };
}

// Debug function to see raw API response
export async function debugGetRawResponse(
  token: string,
  dateFrom: string,
  dateTo: string
): Promise<unknown> {
  await checkRateLimit(token);
  const url = `${BASE_URL}/periods/${token}/${dateFrom}/${dateTo}/transactions.json`;
  const response = await fetch(url);
  return response.json();
}

export async function getTransactions(
  token: string,
  dateFrom: string,
  dateTo: string
): Promise<AccountStatement> {
  await checkRateLimit(token);

  const url = `${BASE_URL}/periods/${token}/${dateFrom}/${dateTo}/transactions.json`;
  const response = await fetch(url);

  if (!response.ok) {
    const messages: Record<number, string> = {
      404: 'Invalid URL or token',
      409: 'Rate limit exceeded (wait 30 seconds)',
      413: 'Too many transactions in response',
      422: 'Invalid request data',
      500: 'Internal server error',
    };
    throw new FioApiError(
      messages[response.status] ?? `HTTP error: ${response.status}`,
      response.status
    );
  }

  const data = (await response.json()) as FioApiResponse;
  return parseResponse(data);
}
