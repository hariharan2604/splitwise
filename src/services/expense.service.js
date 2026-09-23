import { Op } from "sequelize";
import Expense from "../models/Expense.js";
import ExpenseMember from "../models/ExpenseMember.js";
import User from "../models/User.js";
import calculateShares from "../utils/splitCalculator.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/ApiError.js";

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
    throw new BadRequestError(
      "Requesting user must be one of the expense members",
    );
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

export default { create, find, update, remove };
