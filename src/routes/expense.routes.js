import { Router } from "express";
import expenseController from "../controllers/expense.controller";

const expenseRoutes = Router();
expenseRoutes.post("/expenses", expenseController.create);
expenseRoutes.get("/expenses/activity", expenseController.activity);
expenseRoutes.get("/expenses/:id", expenseController.find);
expenseRoutes.put("/expenses/:id", expenseController.update);
expenseRoutes.delete("/expenses/:id", expenseController.remove);

export { expenseRoutes };
