import { Router } from "express";
import userController from "../controllers/user.controller";

const userRoutes = Router();
userRoutes.post("/users", userController.create);
userRoutes.get("/users/:id", userController.find);
userRoutes.put("/users/:id", userController.update);
userRoutes.delete("/users/:id", userController.remove);

export { userRoutes };
