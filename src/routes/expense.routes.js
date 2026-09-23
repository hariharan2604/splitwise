import { Router } from "express";
import expenseController from "../controllers/expense.controller.js";
import userMiddleware from "../middlewares/user.middleware.js";

const expenseRoutes = Router();
expenseRoutes.post("/expenses", userMiddleware, expenseController.create);
expenseRoutes.get("/expenses/activity",userMiddleware,expenseController.activity);
expenseRoutes.get("/expenses/:id", userMiddleware, expenseController.find);
expenseRoutes.put("/expenses/:id", userMiddleware, expenseController.update);
expenseRoutes.delete("/expenses/:id", userMiddleware, expenseController.remove);

export { expenseRoutes };
