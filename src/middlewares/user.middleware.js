import {UnauthorizedError} from "../utils/ApiError"

const userMiddleware = async (req, res, next) => {

   const userId = req.header("X-User-Id");

    if (!userId) 
      return next(new UnauthorizedError("X-User-Id header is required"))
   
    req.userId = Number(userId);

    return next();
};

export default userMiddleware;
