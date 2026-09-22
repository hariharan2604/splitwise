import { Op } from "sequelize";
import Expense from "../models/Expense";
import ExpenseMember from "../models/ExpenseMember";
import User from "../models/User";
import calculateShares from "../utils/splitCalculator";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/ApiError";

const expenseAttributes = [
  "id",
  "name",
  "value",
  "currency",
  "date",
  "paid_by",
  "created_by",
  "split_type",
  "createdAt",
  "updatedAt",
];

const loadMembers = async (expenseId) =>
  ExpenseMember.findAll({
    where: { expense_id: expenseId },
    attributes: ["id", "expense_id", "user_id", "share_amount"],
  });

const serializeExpense = async (expense, requesterId) => {
  const members = await loadMembers(expense.id);
  const result = expense.toJSON();
  result.members = members;
  result.share_amount =
    members.find((member) => String(member.user_id) === String(requesterId))
      ?.share_amount || "0.00";
  return result;
};

const validateUsers = async (paidBy, members) => {
  const ids = [
    ...new Set([
      paidBy,
      ...members.map((member) => member.user_id).map(Number),
    ]),
  ];
  const users = await User.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ["id"],
  });
  if (users.length !== ids.length)
    throw new BadRequestError("One or more users do not exist");
};

const ensureRequesterIsMember = (requesterId, shares) => {
  const isMember = shares.some(
    (share) => String(share.user_id) === String(requesterId),
  );
  if (!isMember) {
    throw new BadRequestError("Requesting user must be one of the expense members");
  }
};

const ensurePayerIsMember = (paidBy, shares) => {
  const isMember = shares.some(
    (share) => String(share.user_id) === String(paidBy),
  );
  if (!isMember) {
    throw new BadRequestError("Payer must be one of the expense members");
  }
};

const ensureExpenseAccess = async (expenseId, requesterId) => {
  const member = await ExpenseMember.findOne({
    where: { expense_id: expenseId, user_id: requesterId },
    attributes: ["id"],
  });
  if (!member) {
    throw new ForbiddenError("You do not have access to this expense");
  }
};

const writeMembers = async (expenseId, shares, transaction) =>
  ExpenseMember.bulkCreate(
    shares.map((share) => ({ expense_id: expenseId, ...share })),
    { transaction },
  );

const create = async (data, requesterId) => {
  const shares = calculateShares(data.value, data.split_type, data.members);
  ensureRequesterIsMember(requesterId, shares);
  ensurePayerIsMember(data.paid_by, shares);
  await validateUsers(data.paid_by, shares);
  const transaction = await Expense.sequelize.transaction();
  try {
    const expense = await Expense.create(
      {
        name: data.name,
        value: data.value,
        currency: data.currency.toUpperCase(),
        date: data.date,
        paid_by: data.paid_by,
        created_by: requesterId,
        split_type: data.split_type,
      },
      { transaction },
    );
    await writeMembers(expense.id, shares, transaction);
    await transaction.commit();
    return serializeExpense(expense, requesterId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const find = async (id, requesterId) => {
  const expense = await Expense.findByPk(id, { attributes: expenseAttributes });
  if (!expense) throw new NotFoundError("Expense not found");
  await ensureExpenseAccess(id, requesterId);
  return serializeExpense(expense, requesterId);
};

const update = async (id, data, requesterId) => {
  const expense = await Expense.findByPk(id);
  if (!expense) throw new NotFoundError("Expense not found");
  await ensureExpenseAccess(id, requesterId);
  const shares = calculateShares(data.value, data.split_type, data.members);
  ensureRequesterIsMember(requesterId, shares);
  ensurePayerIsMember(data.paid_by, shares);
  await validateUsers(data.paid_by, shares);
  const transaction = await Expense.sequelize.transaction();
  try {
    await expense.update(
      {
        name: data.name,
        value: data.value,
        currency: data.currency.toUpperCase(),
        date: data.date,
        paid_by: data.paid_by,
        split_type: data.split_type,
      },
      { transaction },
    );
    await ExpenseMember.destroy({ where: { expense_id: id }, transaction });
    await writeMembers(id, shares, transaction);
    await transaction.commit();
    return serializeExpense(expense, requesterId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const remove = async (id, requesterId) => {
  const expense = await Expense.findByPk(id);
  if (!expense) throw new NotFoundError("Expense not found");
  await ensureExpenseAccess(id, requesterId);
  await expense.destroy();
};

const activity = async (requesterId, from, to) => {
  const now = new Date();
  const startOfLastMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  )
    .toISOString()
    .slice(0, 10);
  const dateFilter =
    from && to ? { [Op.between]: [from, to] } : { [Op.gte]: startOfLastMonth };
  const memberRows = await ExpenseMember.findAll({
    where: { user_id: requesterId },
    attributes: ["expense_id"],
  });
  const ids = memberRows.map((row) => row.expense_id);
  const expenses = await Expense.findAll({
    where: {
      id: { [Op.in]: ids.length ? ids : [0] },
      date: dateFilter,
    },
    order: [
      ["date", "DESC"],
      ["id", "DESC"],
    ],
    attributes: expenseAttributes,
  });
  const owned = await Expense.findAll({
    where: {
      [Op.or]: [{ created_by: requesterId }, { paid_by: requesterId }],
      date: dateFilter,
    },
    attributes: expenseAttributes,
  });
  const byId = new Map(
    [...expenses, ...owned].map((expense) => [expense.id, expense]),
  );
  const items = await Promise.all(
    [...byId.values()]
      .sort((left, right) => right.date.localeCompare(left.date))
      .map((expense) => serializeExpense(expense, requesterId)),
  );
  if (from && to) return { range: items };

  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const previousDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const lastMonth = `${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth() + 1).padStart(2, "0")}`;
  return {
    currentMonth: items.filter((item) => item.date.startsWith(currentMonth)),
    lastMonth: items.filter((item) => item.date.startsWith(lastMonth)),
  };
};

export default { create, find, update, remove, activity };
