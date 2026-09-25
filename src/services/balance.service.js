import Expense from "../models/Expense.js";
import ExpenseMember from "../models/ExpenseMember.js";
import User from "../models/User.js";
import currencyConversion, {
  normalizeCurrency,
} from "../utils/currencyConversion.js";

const addBalance = (
  balances,
  counterpartyId,
  currency,
  amountCents,
  default_currency,
) => {
  if (String(counterpartyId) === String(balances.userId)) return;

  const normalizedCurrency = normalizeCurrency(currency);
  const normalizedDefaultCurrency = normalizeCurrency(default_currency);
  const key = counterpartyId;
  
  if (normalizedCurrency === normalizedDefaultCurrency) {
    balances.values.set(key, (balances.values.get(key) || 0) + amountCents);
    return;
  }
  
  const amount_value = Number((amountCents / 100).toFixed(2));
  const converted_value =
    normalizedDefaultCurrency === "INR"
      ? currencyConversion.convertToINR(normalizedCurrency, amount_value)
      : currencyConversion.convertToTarget(
          normalizedCurrency,
          normalizedDefaultCurrency,
          amount_value,
        );

  balances.values.set(
    key,
    (balances.values.get(key) || 0) + cents(converted_value),
  );
};

const cents = (value) => Math.round(Number(value) * 100);

export const buildBalancePayload = (userId, defaultCurrency, balanceMap) => {
  const normalizedDefaultCurrency = normalizeCurrency(defaultCurrency || "INR");

  const balances = [...balanceMap.entries()]
    .filter(([, value]) => Number(value) !== 0)
    .map(([counterparty_id, value]) => ({
      counterparty_id: Number(counterparty_id),
      balances: Number((Number(value) / 100).toFixed(2)),
    }));

  return {
    user_id: Number(userId),
    default_currency: normalizedDefaultCurrency,
    balances,
  };
};

export default {
  getBalances: async (userId) => {
    const userRecord = await User.findByPk(userId, {
      attributes: ["default_currency"],
    });
    const default_currency = userRecord?.default_currency || "INR";

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

    return buildBalancePayload(userId, default_currency, balances.values);
  },
};
