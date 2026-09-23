import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import globalErrorHandler from "../middlewares/errorHandler.middleware.js";

const routesDir = new URL("../routes/", import.meta.url);
const routeFiles = fs
  .readdirSync(routesDir)
  .filter((file) => file.endsWith(".js"));

let server;
const routes = [];

const expressService = {
  init: async () => {
    try {
      for (const file of routeFiles) {
        const route = await import(new URL(file, routesDir));
        const routeName = Object.keys(route)[0];
        routes.push(route[routeName]);
      }

      server = express();
      server.use(bodyParser.json());
      server.use(routes);
      server.use(globalErrorHandler);
      server.listen(process.env.SERVER_PORT);
      console.log("[EXPRESS] Express initialized");
    } catch (error) {
      console.log("[EXPRESS] Error during express service initialization");
      throw error;
    }
  },
};

export default expressService;
