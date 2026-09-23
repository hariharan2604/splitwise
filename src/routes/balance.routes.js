import { Router } from "express";
import balanceController from "../controllers/balance.controller.js";
import userMiddleware from "../middlewares/user.middleware.js";

const balanceRoutes = Router();
balanceRoutes.get("/balances",userMiddleware, balanceController.get);

export { balanceRoutes };
