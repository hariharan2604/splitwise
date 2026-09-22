import { Router } from "express";
import balanceController from "../controllers/balance.controller";
import userMiddleware from "../middlewares/user.middleware";

const balanceRoutes = Router();
balanceRoutes.get("/balances",userMiddleware, balanceController.get);

export { balanceRoutes };
