import balanceService from "../services/balance.service.js";
import requestUserId from "../utils/requestUser.js";

export default {
  get: async (req, res, next) => {
    try {
      return res.json({
        success: true,
        data: await balanceService.getBalances(requestUserId(req)),
      });
    } catch (error) {
      return next(error);
    }
  },
};
