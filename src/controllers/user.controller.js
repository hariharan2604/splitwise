import * as Yup from "yup";
import userService from "../services/user.service";
import { ValidationError } from "../utils/ApiError";

const userSchema = Yup.object({
  name: Yup.string().required(),
  email: Yup.string().email().required(),
  password: Yup.string().min(6).required(),
  default_currency: Yup.string().length(3).required(),
});

const updateSchema = Yup.object({
  email: Yup.string().email(),
  default_currency: Yup.string().length(3),
}).noUnknown();

const valid = async (schema, body) => {
  if (!(await schema.isValid(body))) throw new ValidationError();
};

export default {
  create: async (req, res, next) => {
    try {
      await valid(userSchema, req.body);
      const user = await userService.create(req.body);
      return res.status(201).json({ success: true, data: user });
    } catch (error) {
      return next(error);
    }
  },
  find: async (req, res, next) => {
    try {
      return res.json({
        success: true,
        data: await userService.find(req.params.id),
      });
    } catch (error) {
      return next(error);
    }
  },
  update: async (req, res, next) => {
    try {
      await valid(updateSchema, req.body);
      return res.json({
        success: true,
        data: await userService.update(req.params.id, req.body),
      });
    } catch (error) {
      return next(error);
    }
  },
  remove: async (req, res, next) => {
    try {
      await userService.remove(req.params.id);
      return res.json({ success: true, data: null });
    } catch (error) {
      return next(error);
    }
  },
};
