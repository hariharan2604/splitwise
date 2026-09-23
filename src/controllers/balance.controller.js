import balanceService from "../services/balance.service";
import requestUserId from "../utils/requestUser";

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
