import * as Yup from "yup";
import expenseService from "../services/expense.service";
import requestUserId from "../utils/requestUser";
import { ValidationError } from "../utils/ApiError";

const expenseSchema = Yup.object({
  name: Yup.string().required(),
  value: Yup.number().moreThan(0).required(),
  currency: Yup.string().length(3).required(),
  date: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  paid_by: Yup.number().integer().positive().required(),
  split_type: Yup.string().oneOf(["EQUAL", "EXACT", "PERCENTAGE"]).required(),
  members: Yup.array().min(1).required(),
}).noUnknown();

const valid = async (body) => {
  if (!(await expenseSchema.isValid(body))) throw new ValidationError();
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
      await expenseService.remove(req.params.id);
      return res.json({ success: true, data: null });
    } catch (error) {
      return next(error);
    }
  },
  activity: async (req, res, next) => {
    try {
      const hasFrom = Boolean(req.query.from);
      const hasTo = Boolean(req.query.to);
      if (hasFrom !== hasTo)
        throw new ValidationError("Both from and to are required");
      if (
        (hasFrom && !/^\d{4}-\d{2}-\d{2}$/.test(req.query.from)) ||
        (hasTo && !/^\d{4}-\d{2}-\d{2}$/.test(req.query.to))
      ) {
        throw new ValidationError("Date range must use YYYY-MM-DD");
      }
      if (hasFrom && req.query.from > req.query.to) {
        throw new ValidationError("from must be before to");
      }
      return res.json({
        success: true,
        data: await expenseService.activity(
          requestUserId(req),
          req.query.from,
          req.query.to,
        ),
      });
    } catch (error) {
      return next(error);
    }
  },
};
