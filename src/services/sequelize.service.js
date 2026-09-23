import { Sequelize } from "sequelize";
import databaseConfig from "../config/database.js";
import fs from "fs";

const modelsDir = new URL("../models/", import.meta.url);
const modelFiles = fs
  .readdirSync(modelsDir)
  .filter((file) => file.endsWith(".js"));

const sequelizeService = {
  init: async () => {
    try {
      const connection = new Sequelize(databaseConfig);

      for (const file of modelFiles) {
        const model = await import(new URL(file, modelsDir));
        model.default.init(connection);
      }

      for (const file of modelFiles) {
        const model = await import(new URL(file, modelsDir));
        model.default.associate && model.default.associate(connection.models);
      }

      console.log("[SEQUELIZE] Database service initialized");
    } catch (error) {
      console.log("[SEQUELIZE] Error during database service initialization");
      throw error;
    }
  },
};

export default sequelizeService;
