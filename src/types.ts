/**
 * FIO Bank API Types
 * Based on: https://www.fio.cz/docs/cz/API_Bankovnictvi.pdf
 */

export interface AccountInfo {
  accountId: string;
  bankId: string;
  currency: string;
  iban: string;
  bic: string;
  openingBalance: number;
  closingBalance: number;
  dateStart?: string;
  dateEnd?: string;
  idFrom?: number;
  idTo?: number;
}

export interface Transaction {
  transactionId: string;
  date: string;
  amount: number;
  currency: string;
  counterAccount?: string;
  counterAccountName?: string;
  bankCode?: string;
  bankName?: string;
  constantSymbol?: string;
  variableSymbol?: string;
  specificSymbol?: string;
  userIdentification?: string;
  messageForRecipient?: string;
  transactionType?: string;
  performer?: string;
  specification?: string;
  comment?: string;
  bic?: string;
  orderId?: number;
  payerReference?: string;
}

export interface AccountStatement {
  info: AccountInfo;
  transactions: Transaction[];
}

// FIO API JSON response structure
export interface FioApiResponse {
  accountStatement: {
    info: {
      accountId: string;
      bankId: string;
      currency: string;
      iban: string;
      bic: string;
      openingBalance: number;
      closingBalance: number;
      dateStart?: string;
      dateEnd?: string;
      idFrom?: number;
      idTo?: number;
    };
    transactionList?: {
      transaction: Array<{
        column0?: { value: string } | null;
        column1?: { value: number } | null;
        column2?: { value: string } | null;
        column3?: { value: string } | null;
        column4?: { value: string } | null;
        column5?: { value: string } | null;
        column6?: { value: string } | null;
        column7?: { value: string } | null;
        column8?: { value: string } | null;
        column9?: { value: string } | null;
        column10?: { value: string } | null;
        column12?: { value: string } | null;
        column14?: { value: string } | null;
        column16?: { value: string } | null;
        column17?: { value: number } | null;
        column18?: { value: string } | null;
        column22?: { value: number } | null;
        column25?: { value: string } | null;
        column26?: { value: string } | null;
        column27?: { value: string } | null;
      }>;
    };
  };
}
