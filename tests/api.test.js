import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import express from "express";
import bodyParser from "body-parser";
import { userRoutes } from "../src/routes/user.routes";
import { expenseRoutes } from "../src/routes/expense.routes";
import { balanceRoutes } from "../src/routes/balance.routes";
import globalErrorHandler from "../src/middlewares/errorHandler.middleware";
import userService from "../src/services/user.service";
import expenseService from "../src/services/expense.service";
import balanceService from "../src/services/balance.service";

const app = express();
app.use(bodyParser.json());
app.use(userRoutes);
app.use(expenseRoutes);
app.use(balanceRoutes);
app.use(globalErrorHandler);

userService.create = async (data) => ({
  id: 1,
  name: data.name,
  email: data.email,
  default_currency: data.default_currency,
});
userService.find = async (id) => ({
  id: Number(id),
  name: "Asha",
  email: "asha@example.com",
  default_currency: "INR",
});
userService.update = async (id, data) => ({
  id: Number(id),
  name: "Asha",
  email: data.email || "asha@example.com",
  default_currency: data.default_currency || "INR",
});
userService.remove = async () => undefined;

expenseService.create = async (data, requesterId) => ({
  id: 10,
  ...data,
  created_by: requesterId,
  members: data.members.map((member) => ({
    ...member,
    share_amount: member.share_amount || "50.00",
  })),
});
expenseService.find = async (id) => ({ id: Number(id), name: "Dinner" });
expenseService.update = async (id, data) => ({ id: Number(id), ...data });
expenseService.remove = async () => undefined;
balanceService.getBalances = async (userId) => [
  { counterparty_id: 2, balances: [{ currency: "INR", amount: 50 }] },
];

const request = (method, path, body, headers = {}) =>
  new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      const requestBody = body ? JSON.stringify(body) : null;
      const request = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path,
          method,
          headers: {
            ...(requestBody ? { "Content-Type": "application/json" } : {}),
            ...(requestBody
              ? { "Content-Length": Buffer.byteLength(requestBody) }
              : {}),
            ...headers,
          },
        },
        (response) => {
          let responseBody = "";
          response.on("data", (chunk) => {
            responseBody += chunk;
          });
          response.on("end", () => {
            server.close();
            resolve({
              status: response.statusCode,
              body: responseBody ? JSON.parse(responseBody) : null,
            });
          });
        },
      );
      request.on("error", (error) => {
        server.close();
        reject(error);
      });
      if (requestBody) request.write(requestBody);
      request.end();
    });
  });

const assertUnauthorized = async (method, path) => {
  const response = await request(method, path);
  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.statusCode, 401);
};

test("POST /users validates invalid input", async () => {
  const response = await request("POST", "/users", {
    name: "Invalid user",
    email: "not-an-email",
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("protected user routes require X-User-Id", async () => {
  await assertUnauthorized("GET", "/users/1");
  await assertUnauthorized("PUT", "/users/1");
  await assertUnauthorized("DELETE", "/users/1");
});

test("expense routes require X-User-Id", async () => {
  await assertUnauthorized("POST", "/expenses");
  await assertUnauthorized("GET", "/expenses/1");
  await assertUnauthorized("PUT", "/expenses/1");
  await assertUnauthorized("DELETE", "/expenses/1");
});

test("balance route requires X-User-Id", async () => {
  await assertUnauthorized("GET", "/balances");
});

test("X-User-Id reaches expense validation", async () => {
  const response = await request(
    "POST",
    "/expenses",
    {
      name: "Invalid date expense",
      value: 100,
      currency: "INR",
      date: "2026-02-30",
      paid_by: 1,
      split_type: "EQUAL",
      members: [{ user_id: 1 }],
    },
    { "X-User-Id": "1" },
  );

  assert.equal(response.status, 400);
  assert.equal(
    response.body.error.message,
    "date must be a valid YYYY-MM-DD date",
  );
});

test("user CRUD returns the expected success envelopes", async () => {
  const created = await request("POST", "/users", {
    name: "Asha",
    email: "asha@example.com",
    password: "secret123",
    default_currency: "INR",
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.default_currency, "INR");

  const found = await request("GET", "/users/1", undefined, {
    "X-User-Id": "1",
  });
  assert.equal(found.status, 200);
  assert.equal(found.body.data.id, 1);

  const updated = await request(
    "PUT",
    "/users/1",
    { default_currency: "USD" },
    { "X-User-Id": "1" },
  );
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.default_currency, "USD");

  const removed = await request("DELETE", "/users/1", undefined, {
    "X-User-Id": "1",
  });
  assert.equal(removed.status, 200);
  assert.deepEqual(removed.body, { success: true, data: null });
});

test("expense CRUD returns the expected success envelopes", async () => {
  const payload = {
    name: "Dinner",
    value: 100,
    currency: "INR",
    date: "2026-09-22",
    paid_by: 1,
    split_type: "EQUAL",
    members: [{ user_id: 1 }, { user_id: 2 }],
  };
  const headers = { "X-User-Id": "1" };

  const created = await request("POST", "/expenses", payload, headers);
  assert.equal(created.status, 201);
  assert.equal(created.body.data.created_by, 1);

  const found = await request("GET", "/expenses/10", undefined, headers);
  assert.equal(found.status, 200);
  assert.equal(found.body.data.id, 10);

  const updated = await request(
    "PUT",
    "/expenses/10",
    { ...payload, name: "Updated dinner" },
    headers,
  );
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.name, "Updated dinner");

  const removed = await request("DELETE", "/expenses/10", undefined, headers);
  assert.equal(removed.status, 200);
  assert.deepEqual(removed.body, { success: true, data: null });
});

test("GET /balances returns balances for the acting user", async () => {
  const response = await request("GET", "/balances", undefined, {
    "X-User-Id": "1",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data, [
    { counterparty_id: 2, balances: [{ currency: "INR", amount: 50 }] },
  ]);
});
