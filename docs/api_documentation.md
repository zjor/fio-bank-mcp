# FIO Bank API - Get Transactions by Period

## Endpoint

```
GET https://fioapi.fio.cz/v1/rest/periods/{token}/{dateFrom}/{dateTo}/transactions.{format}
```

## Description

Retrieves account transactions for a specified date range from FIO Bank.

## URL Parameters

| Parameter  | Type   | Required | Description                                                 |
|------------|--------|----------|-------------------------------------------------------------|
| `token`    | string | Yes      | 64-character API token generated in internet banking        |
| `dateFrom` | string | Yes      | Start date in `YYYY-MM-DD` format                           |
| `dateTo`   | string | Yes      | End date in `YYYY-MM-DD` format                             |
| `format`   | string | Yes      | Response format: `json`, `xml`, `csv`, `gpc`, `html`, `ofx` |

## Example Request

```
GET https://fioapi.fio.cz/v1/rest/periods/aGEMQB9Idh35fh1g51h3ekkQwyGlQ.../2024-01-01/2024-01-31/transactions.json
```

## Rate Limiting

- **1 request per 30 seconds** per token
- Exceeding the limit returns HTTP 409 Conflict

## Data Access Restrictions

- Data up to **90 days old**: accessible without additional authorization
- Data older than 90 days: requires temporary unlock in internet banking (Settings → API → click lock icon, valid for 10 minutes)

## Response Format (JSON)

### Structure

```json
{
  "accountStatement": {
    "info": { ... },
    "transactionList": {
      "transaction": [ ... ]
    }
  }
}
```

### Info Object

| Field            | Type    | Description                              |
|------------------|---------|------------------------------------------|
| `accountId`      | string  | Account number                           |
| `bankId`         | string  | Bank code (2010 for FIO)                 |
| `currency`       | string  | Account currency (ISO 4217, e.g., `CZK`) |
| `iban`           | string  | IBAN (ISO 13616)                         |
| `bic`            | string  | BIC/SWIFT code (ISO 9362)                |
| `openingBalance` | decimal | Balance at start of period               |
| `closingBalance` | decimal | Balance at end of period                 |
| `dateStart`      | date    | Start of period (YYYY-MM-DD+GMT)         |
| `dateEnd`        | date    | End of period (YYYY-MM-DD+GMT)           |
| `idFrom`         | number  | First transaction ID in response         |
| `idTo`           | number  | Last transaction ID in response          |

### Transaction Object

Each transaction is represented with `column_X` fields:

| Column      | ID | Field Name               | Type    | Required | Description                              |
|-------------|----|--------------------------|---------|----------|------------------------------------------|
| `column_22` | 22 | ID pohybu                | string  | Yes      | Unique transaction ID                    |
| `column_0`  | 0  | Datum                    | date    | Yes      | Transaction date                         |
| `column_1`  | 1  | Objem                    | decimal | Yes      | Amount (negative for outgoing)           |
| `column_14` | 14 | Měna                     | string  | Yes      | Currency (ISO 4217)                      |
| `column_2`  | 2  | Protiúčet                | string  | No       | Counter account number                   |
| `column_10` | 10 | Název protiúčtu          | string  | No       | Counter account name                     |
| `column_3`  | 3  | Kód banky                | string  | No       | Counter account bank code                |
| `column_12` | 12 | Název banky              | string  | No       | Counter account bank name                |
| `column_4`  | 4  | KS                       | string  | No       | Constant symbol (4 digits)               |
| `column_5`  | 5  | VS                       | string  | No       | Variable symbol (up to 10 digits)        |
| `column_6`  | 6  | SS                       | string  | No       | Specific symbol (up to 10 digits)        |
| `column_7`  | 7  | Uživatelská identifikace | string  | No       | User identification                      |
| `column_16` | 16 | Zpráva pro příjemce      | string  | No       | Message for recipient (max 140 chars)    |
| `column_8`  | 8  | Typ                      | string  | No       | Transaction type                         |
| `column_9`  | 9  | Provedl                  | string  | No       | Authorized person                        |
| `column_18` | 18 | Upřesnění                | string  | No       | Additional details (e.g., exchange rate) |
| `column_25` | 25 | Komentář                 | string  | No       | Comment                                  |
| `column_26` | 26 | BIC                      | string  | No       | Counter account BIC (ISO 9362)           |
| `column_17` | 17 | ID pokynu                | number  | No       | Order/instruction ID                     |
| `column_27` | 27 | Reference plátce         | string  | No       | Payer reference                          |

### Transaction Column Format

Each column is an object with:
- `value` - the actual value
- `name` - Czech field name
- `id` - column ID number

```json
{
  "column_22": {
    "value": 1147608196,
    "name": "ID pohybu",
    "id": 22
  }
}
```

## Example Response (JSON)

```json
{
  "accountStatement": {
    "info": {
      "accountId": "2111111111",
      "bankId": "2010",
      "currency": "CZK",
      "iban": "CZ7920100000002111111111",
      "bic": "FIOBCZPPXXX",
      "openingBalance": 7356.22,
      "closingBalance": 7321.22,
      "dateStart": "2024-01-01+01:00",
      "dateEnd": "2024-01-31+01:00",
      "idFrom": 1147608196,
      "idTo": 1147608197
    },
    "transactionList": {
      "transaction": [
        {
          "column_22": { "value": 1147608196, "name": "ID pohybu", "id": 22 },
          "column_0": { "value": "2024-01-15+01:00", "name": "Datum", "id": 0 },
          "column_1": { "value": -150.00, "name": "Objem", "id": 1 },
          "column_14": { "value": "CZK", "name": "Měna", "id": 14 },
          "column_2": { "value": "2222233333", "name": "Protiúčet", "id": 2 },
          "column_10": { "value": "Jan Novák", "name": "Název protiúčtu", "id": 10 },
          "column_3": { "value": "2010", "name": "Kód banky", "id": 3 },
          "column_12": { "value": "Fio banka, a.s.", "name": "Název banky", "id": 12 },
          "column_5": { "value": "1234567890", "name": "VS", "id": 5 },
          "column_8": { "value": "Platba převodem uvnitř banky", "name": "Typ", "id": 8 },
          "column_9": { "value": "Novák, Jan", "name": "Provedl", "id": 9 },
          "column_17": { "value": 2102392862, "name": "ID pokynu", "id": 17 }
        }
      ]
    }
  }
}
```

## Error Responses

| HTTP Code | Description |
|-----------|-------------|
| 404 | Invalid URL or token |
| 409 | Rate limit exceeded (wait 30 seconds) |
| 413 | Too many transactions in response |
| 422 | Invalid request data |
| 500 | Internal server error |

## Transaction Types

| ID | Type (Czech)                 | Description                |
|----|------------------------------|----------------------------|
| 1  | Příjem převodem uvnitř banky | Internal incoming transfer |
| 2  | Platba převodem uvnitř banky | Internal outgoing transfer |
| 3  | Vklad pokladnou              | Cash deposit at branch     |
| 4  | Výběr pokladnou              | Cash withdrawal at branch  |
| 5  | Vklad v hotovosti            | Cash deposit               |
| 6  | Výběr v hotovosti            | Cash withdrawal            |
| 7  | Platba                       | Payment                    |
| 8  | Příjem                       | Income                     |
| 9  | Bezhotovostní platba         | Non-cash payment           |
| 10 | Bezhotovostní příjem         | Non-cash income            |
| 11 | Platba kartou                | Card payment               |
| 18 | Připsaný úrok                | Credited interest          |
| 20 | Odvod daně z úroků           | Interest tax deduction     |
| 22 | Poplatek                     | Fee                        |
| 36 | Inkaso                       | Direct debit               |
| 41 | Okamžitá příchozí platba     | Instant incoming payment   |
| 42 | Okamžitá odchozí platba      | Instant outgoing payment   |

## Notes

- All amounts are in the account currency unless specified otherwise
- Negative amounts indicate outgoing transactions
- Transaction IDs (`column_22`) are unique across the entire system
- Order IDs (`column_17`) may appear on multiple transactions (e.g., payment + fee)
- Dates include timezone offset (e.g., `+01:00` for CET, `+02:00` for CEST)