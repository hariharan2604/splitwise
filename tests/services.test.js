import assert from "node:assert/strict";
import test from "node:test";
import User from "../src/models/User";
import Expense from "../src/models/Expense";
import ExpenseMember from "../src/models/ExpenseMember";
import userService from "../src/services/user.service";
import expenseService from "../src/services/expense.service";
import balanceService from "../src/services/balance.service";
import sequelizeService from "../src/services/sequelize.service";
import expressService from "../src/services/express.service";

const originalMethods = new Map();

const stub = (target, method, implementation) => {
  const key = `${target.name || "object"}.${method}`;
  if (!originalMethods.has(key)) originalMethods.set(key, target[method]);
  target[method] = implementation;
};

test.afterEach(() => {
  for (const [key, implementation] of originalMethods) {
    const [targetName, method] = key.split(".");
    const target = { User, Expense, ExpenseMember }[targetName];
    if (target) target[method] = implementation;
  }
  originalMethods.clear();
});

test("user service creates users and removes password hashes", async () => {
  stub(User, "findOne", async () => null);
  stub(User, "create", async (data) => ({
    ...data,
    password_hash: "hashed-password",
    toJSON() {
      return { ...this };
    },
  }));

  const user = await userService.create({
    name: "Asha",
    email: "asha@example.com",
    password: "secret123",
    default_currency: "inr",
  });

  assert.equal(user.default_currency, "INR");
  assert.equal(user.password_hash, undefined);
});

test("user service rejects duplicate emails and expense history deletion", async () => {
  stub(User, "findOne", async () => ({ id: 1 }));
  await assert.rejects(
    userService.create({
      name: "Asha",
      email: "asha@example.com",
      password: "secret123",
      default_currency: "INR",
    }),
    /Email is already in use/,
  );

  stub(User, "findByPk", async () => ({ id: 1 }));
  stub(ExpenseMember, "findOne", async () => ({ id: 10 }));
  stub(Expense, "findOne", async () => null);
  await assert.rejects(userService.remove(1), /expense history/);
});

test("expense service creates an equal split in one transaction", async () => {
  const transaction = {
    commit: async () => undefined,
    rollback: async () => undefined,
  };
  stub(User, "findAll", async () => [{ id: 1 }, { id: 2 }]);
  Expense.sequelize = { transaction: async () => transaction };
  stub(Expense, "create", async (data) => ({
    id: 20,
    toJSON: () => data,
  }));
  stub(ExpenseMember, "bulkCreate", async () => undefined);
  stub(ExpenseMember, "findAll", async () => [
    { user_id: 1, share_amount: "50.00" },
    { user_id: 2, share_amount: "50.00" },
  ]);

  const result = await expenseService.create(
    {
      name: "Dinner",
      value: 100,
      currency: "inr",
      date: "2026-09-22",
      paid_by: 1,
      split_type: "EQUAL",
      members: [{ user_id: 1 }, { user_id: 2 }],
    },
    1,
  );

  assert.equal(result.currency, "INR");
  assert.equal(result.members.length, 2);
  assert.equal(result.share_amount, "50.00");
});

test("expense service rejects a requester who is not an expense member", async () => {
  await assert.rejects(
    expenseService.create(
      {
        name: "Dinner",
        value: 100,
        currency: "INR",
        date: "2026-09-22",
        paid_by: 1,
        split_type: "EQUAL",
        members: [{ user_id: 1 }, { user_id: 2 }],
      },
      3,
    ),
    /Requesting user must be one of the expense members/,
  );
});

test("balance service nets amounts by counterparty and currency", async () => {
  stub(ExpenseMember, "findAll", async (options) => {
    if (options.include) {
      return [
        {
          user_id: 1,
          share_amount: "50.00",
          Expense: { paid_by: 2, currency: "INR" },
        },
      ];
    }
    return [];
  });
  stub(Expense, "findAll", async () => [
    {
      paid_by: 1,
      currency: "USD",
      ExpenseMembers: [{ user_id: 2, share_amount: "20.00" }],
    },
  ]);

  const balances = await balanceService.getBalances(1);

  assert.deepEqual(balances, [
    {
      counterparty_id: 2,
      balances: [
        { currency: "INR", amount: -50 },
        { currency: "USD", amount: 20 },
      ],
    },
  ]);
});

test("database and Express services expose startup contracts", () => {
  assert.equal(typeof sequelizeService.init, "function");
  assert.equal(typeof expressService.init, "function");
});
