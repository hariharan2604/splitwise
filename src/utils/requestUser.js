import { BadRequestError } from "./ApiError";

export default function requestUserId(req) {
  const value = req.userId ?? req.body?.user_id ?? req.query?.user_id;
  const userId = Number(value);
  if (!Number.isInteger(userId) || userId < 1) {
    throw new BadRequestError("A valid user_id is required");
  }
  return userId;
}
