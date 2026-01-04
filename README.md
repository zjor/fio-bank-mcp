# FIO Bank MCP Server

An MCP (Model Context Protocol) server for FIO Bank API in Czech Republic. Allows AI assistants like Claude to access FIO Bank account transactions.

## Installation

```bash
pnpm install
pnpm build
```

## Configuration

### Getting an API Token

1. Log in to your FIO Bank internet banking
2. Go to **Settings** → **API**
3. Create a new token (requires SMS or push notification)
4. Wait 5 minutes before using the token

### Token Properties

- Each token is valid for one account only
- Maximum validity: 180 days
- Can auto-renew on each login to internet banking

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "fio-bank": {
      "command": "node",
      "args": ["/path/to/fio-bank-mcp/dist/index.js"],
      "env": {
        "FIO_API_TOKEN": "your-64-character-token-here"
      }
    }
  }
}
```

## Available Tools

### `fio_get_transactions`

Get account transactions for a specific date range.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `dateFrom` | string | Yes | Start date (YYYY-MM-DD) |
| `dateTo` | string | Yes | End date (YYYY-MM-DD) |
| `token` | string | No | API token (uses `FIO_API_TOKEN` env var if not provided) |

**Returns:**
- Account info (IBAN, BIC, balance)
- List of transactions with:
  - Transaction ID, date, amount, currency
  - Counter account (number, name, bank)
  - Payment symbols (variable, constant, specific)
  - Message for recipient, comments
  - Transaction type

## Testing Locally

Use the MCP Inspector to test the server with a web UI:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens a browser where you can see available tools, call them with parameters, and view responses.

To pass the API token:

```bash
FIO_API_TOKEN=your-token npx @modelcontextprotocol/inspector node dist/index.js
```

## API Rate Limits

**1 request per 30 seconds per token.** The server automatically waits if needed.

## Data Access

- Data up to **90 days old**: accessible immediately
- Data older than 90 days: requires temporary unlock in internet banking (Settings → API → click lock icon, valid for 10 minutes)

## Error Codes

| Code | Description |
|------|-------------|
| 404 | Invalid URL or token |
| 409 | Rate limit exceeded (wait 30 seconds) |
| 413 | Too many transactions in response |
| 422 | Invalid request data |
| 500 | Internal server error |

## Development

```bash
pnpm install      # Install dependencies
pnpm build        # Build TypeScript
pnpm lint         # Run ESLint
pnpm typecheck    # Type check without emitting
```

## Resources

- [FIO Bank API Documentation (Czech)](https://www.fio.cz/docs/cz/API_Bankovnictvi.pdf)
- [MCP Protocol](https://modelcontextprotocol.io)

## License

MIT
