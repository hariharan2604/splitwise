# Splitwise MVP

A Splitwise-style expense sharing API built with Node.js, Express, Sequelize, and PostgreSQL or MySQL.

## Setup

Install dependencies:

```bash
yarn install
```

Configure the database and server in `.env`:

```env
SERVER_PORT=3000
NODE_ENV=development
DB_DIALECT=postgres
DB_HOST=localhost
DB_USER=postgres
DB_PASS=postgres
DB_NAME=splitwise
```

Run migrations and start the API:

```bash
yarn sequelize-cli db:migrate
yarn dev
```

## API

The API returns `{ "success": true, "data": ... }` on success and a consistent error object on failure. Authentication is intentionally outside this MVP; provide the acting user through the existing request context or `user_id` query/body value where required.

- `POST /users` creates a user with `name`, `email`, `password`, and `default_currency`.
- `GET /users/:id`, `PUT /users/:id`, and `DELETE /users/:id` manage users.
- `POST /expenses` creates an equal, exact, or percentage split.
- `GET /expenses/:id`, `PUT /expenses/:id`, and `DELETE /expenses/:id` manage expenses.
- `GET /expenses/activity` returns current-month, last-month, or custom-range activity.
- `GET /balances` computes net balances per counterparty and currency.

Expense members use this shape:

```json
{
  "user_id": 2,
  "share_amount": 50
}
```

For percentage splits, use `percentage` instead of `share_amount`. Exact shares are validated against the total expense value before writing.

## Database design

Balances are computed on read. Expense members store final share amounts, while expenses retain the split type for display. Currencies are never converted or netted together.
