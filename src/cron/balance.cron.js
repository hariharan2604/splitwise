import nodeCron from "node-cron";

import { ValidationError } from "../utils/ApiError.js";
import balanceService from "../services/balance.service.js";

const CRON_CONFIG = "* * * * *";

const cronService = {
  init: () => {
    cronService.schedule(1);
  },

  schedule: (userId) => {
    if (!nodeCron.validate(CRON_CONFIG)) {
      throw new ValidationError("Invalid Cron Configuration");
    }

    nodeCron.schedule(CRON_CONFIG, async () => {
      try {
        const balanceReport = await balanceService.getBalances(userId);

        console.log(JSON.stringify(balanceReport));
      } catch (error) {
        console.error("Balance cron job failed:", error);
      }
    });
  },
};

export default cronService;