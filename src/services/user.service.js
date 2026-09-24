import User from "../models/User.js";
import Expense from "../models/Expense.js";
import ExpenseMember from "../models/ExpenseMember.js";
import { Op } from "sequelize";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../utils/ApiError.js";

const findUser = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ["password_hash"] },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
};

export default {
  create: async (data) => {
    const exists = await User.findOne({ where: { email: data.email } });
    if (exists) throw new BadRequestError("Email is already in use");
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      default_currency: data.default_currency.toUpperCase(),
    });
    const result = user.toJSON();
    delete result.password_hash;
    return result;
  },

  find: findUser,

  update: async (id, data) => {
    const user = await findUser(id);
    if (data.email && data.email !== user.email) {
      const exists = await User.findOne({ where: { email: data.email } });
      if (exists) throw new BadRequestError("Email is already in use");
    }
    await user.update({
      ...(data.email ? { email: data.email } : {}),
      ...(data.default_currency
        ? { default_currency: data.default_currency.toUpperCase() }
        : {}),
    });
    return user;
  },

  remove: async (id) => {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError("User not found");

    const hasExpenseHistory = await ExpenseMember.findOne({
      where: { user_id: id },
      attributes: ["id"],
    });
    const hasCreatedOrPaidExpense = await Expense.findOne({
      where: {
        [Op.or]: [{ created_by: id }, { paid_by: id }],
      },
      attributes: ["id"],
    });

    if (hasExpenseHistory || hasCreatedOrPaidExpense) {
      throw new ConflictError(
        "User cannot be deleted because they have expense history",
      );
    }

    await user.destroy();
  },
};
