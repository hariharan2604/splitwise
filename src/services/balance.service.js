import Expense from "../models/Expense.js";
import ExpenseMember from "../models/ExpenseMember.js";
import User from "../models/User.js";
import currencyConversion from "../utils/currencyConversion.js";

const addBalance = (
  balances,
  counterpartyId,
  currency,
  amountCents,
  default_currency,
) => {
  if (String(counterpartyId) === String(balances.userId)) return;
  const key = `${counterpartyId}`;
  if (currency === default_currency) {
    balances.values.set(key, (balances.values.get(key) || 0) + amountCents);
  } else if (default_currency === "INR") {
    const amount_value = Number((amountCents / 100).toFixed(2));
    const converted_value = currencyConversion.convertToINR(
      currency,
      amount_value,
    );
    balances.values.set(
      key,
      (balances.values.get(key) || 0) + cents(converted_value),
    );
  }
  else{
    const amount_value = Number((amountCents / 100).toFixed(2));
    const converted_value = currencyConversion.convertToTarget(
      currency,
      default_currency,
      amount_value,
    );
    balances.values.set(
      key,
      (balances.values.get(key) || 0) + cents(converted_value),
    );
  }
  const amount_value = Number((amountCents / 100).toFixed(2));
  const converted_value = currencyConversion.convertToTarget(
    currency,
    default_currency,
    amount_value,
  );
  balances.values.set(
    key,
    (balances.values.get(key) || 0) + cents(converted_value),
  );
};

const cents = (value) => Math.round(Number(value) * 100);

export default {
  getBalances: async (userId) => {
    const default_currency = await User.findByPk(userId, {
      attributes: ["default_currency"],
    });

    const balances = { userId, values: new Map() };
    const memberRows = await ExpenseMember.findAll({
      where: { user_id: userId, is_paid: false },
      include: [{ model: Expense, attributes: ["paid_by", "currency"] }],
    });
    const paidExpenses = await Expense.findAll({
      where: { paid_by: userId },
      include: [
        {
          model: ExpenseMember,
          where: { is_paid: false },
          attributes: ["user_id", "share_amount"],
        },
      ],
    });

    for (const member of memberRows) {
      addBalance(
        balances,
        member.Expense.paid_by,
        member.Expense.currency,
        -cents(member.share_amount),
        default_currency,
      );
    }
    for (const expense of paidExpenses) {
      for (const member of expense.ExpenseMembers || []) {
        addBalance(
          balances,
          member.user_id,
          expense.currency,
          cents(member.share_amount),
          default_currency,
        );
      }
    }

    // const grouped = new Map();
    // for (const [key, amount] of balances.values) {
    //   if (!amount) continue;
    //   const [counterpartyId, currency] = key.split(":");
    //   if (!grouped.has(counterpartyId)) grouped.set(counterpartyId, []);
    //   grouped
    //     .get(counterpartyId)
    //     .push({ currency, amount: Number((amount / 100).toFixed(2)) });
    // }
    return [...balances.values.entries()].map(([counterparty_id, values]) => ({
      counterparty_id: Number(counterparty_id),
      balances: values,
    }));
  },
};
