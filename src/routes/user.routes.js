import { Router } from "express";
import userController from "../controllers/user.controller";
import userMiddleware from "../middlewares/user.middleware";

const userRoutes = Router();
userRoutes.post("/users", userController.create);
userRoutes.get("/users/:id", userMiddleware, userController.find);
userRoutes.put("/users/:id", userMiddleware, userController.update);
userRoutes.delete("/users/:id", userMiddleware, userController.remove);

export { userRoutes };
