import * as Yup from "yup";
import expenseService from "../services/expense.service";
import requestUserId from "../utils/requestUser";
import { ValidationError } from "../utils/ApiError";

const isValidDateOnly = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const expenseSchema = Yup.object({
  name: Yup.string().required(),
  value: Yup.number().moreThan(0).required(),
  currency: Yup.string().length(3).required(),
  date: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  paid_by: Yup.number().integer().positive().required(),
  split_type: Yup.string().oneOf(["EQUAL", "EXACT", "PERCENTAGE"]).required(),
  members: Yup.array()
    .of(
      Yup.object({
        user_id: Yup.number().integer().positive().required(),
        share_amount: Yup.number().min(0),
        amount: Yup.number().min(0),
        percentage: Yup.number().min(0),
      }).noUnknown(false),
    )
    .min(1)
    .required(),
}).noUnknown();

const valid = async (body) => {
  if (!(await expenseSchema.isValid(body))) throw new ValidationError();
  if (!isValidDateOnly(body.date)) {
    throw new ValidationError("date must be a valid YYYY-MM-DD date");
  }
};

export default {
  create: async (req, res, next) => {
    try {
      await valid(req.body);
      const userId = requestUserId(req);
      return res.status(201).json({
        success: true,
        data: await expenseService.create(req.body, userId),
      });
    } catch (error) {
      return next(error);
    }
  },
  find: async (req, res, next) => {
    try {
      return res.json({
        success: true,
        data: await expenseService.find(req.params.id, requestUserId(req)),
      });
    } catch (error) {
      return next(error);
    }
  },
  update: async (req, res, next) => {
    try {
      await valid(req.body);
      const userId = requestUserId(req);
      return res.json({
        success: true,
        data: await expenseService.update(req.params.id, req.body, userId),
      });
    } catch (error) {
      return next(error);
    }
  },
  remove: async (req, res, next) => {
    try {
      await expenseService.remove(req.params.id, requestUserId(req));
      return res.json({ success: true, data: null });
    } catch (error) {
      return next(error);
    }
  },
};
