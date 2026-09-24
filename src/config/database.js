import "dotenv/config";

export default {
  dialect: process.env.DB_DIALECT,
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  define: {
    timestamps: true,
  },
  logging: process.env.NODE_ENV === 'production' ? false : console.log
};
