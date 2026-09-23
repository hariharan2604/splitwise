import Expense from "../models/Expense.js";
import ExpenseMember from "../models/ExpenseMember.js";

const addBalance = (balances, counterpartyId, currency, amountCents) => {
  if (String(counterpartyId) === String(balances.userId)) return;
  const key = `${counterpartyId}:${currency}`;
  balances.values.set(key, (balances.values.get(key) || 0) + amountCents);
};

const cents = (value) => Math.round(Number(value) * 100);

const getBalances = async (userId) => {
  const balances = { userId, values: new Map() };
  const memberRows = await ExpenseMember.findAll({
    where: { user_id: userId },
    include: [{ model: Expense, attributes: ["paid_by", "currency"] }],
  });
  const paidExpenses = await Expense.findAll({
    where: { paid_by: userId },
    include: [
      { model: ExpenseMember, attributes: ["user_id", "share_amount"] },
    ],
  });

  for (const member of memberRows) {
    addBalance(
      balances,
      member.Expense.paid_by,
      member.Expense.currency,
      -cents(member.share_amount),
    );
  }
  for (const expense of paidExpenses) {
    for (const member of expense.ExpenseMembers || []) {
      addBalance(
        balances,
        member.user_id,
        expense.currency,
        cents(member.share_amount),
      );
    }
  }

  const grouped = new Map();
  for (const [key, amount] of balances.values) {
    if (!amount) continue;
    const [counterpartyId, currency] = key.split(":");
    if (!grouped.has(counterpartyId)) grouped.set(counterpartyId, []);
    grouped
      .get(counterpartyId)
      .push({ currency, amount: Number((amount / 100).toFixed(2)) });
  }
  return [...grouped.entries()].map(([counterparty_id, values]) => ({
    counterparty_id: Number(counterparty_id),
    balances: values,
  }));
};

export default { getBalances };
