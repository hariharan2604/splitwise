import dotenv from "dotenv";
import expressService from "./services/express.service.js";
import sequelizeService from "./services/sequelize.service.js";
dotenv.config();

const services = [sequelizeService, expressService];

(async () => {
  try {
    for (const service of services) {
      await service.init();
    }
    console.log("Server initialized.");
    //PUT ADITIONAL CODE HERE.
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
