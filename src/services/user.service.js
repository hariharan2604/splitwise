import User from "../models/User";
import { BadRequestError, NotFoundError } from "../utils/ApiError";

const create = async (data) => {
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
};

const find = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ["password_hash"] },
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
};

const update = async (id, data) => {
  const user = await find(id);
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
};

const remove = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundError("User not found");
  await user.destroy();
};

export default { create, find, update, remove };
