"use strict";

export const up = (queryInterface, Sequelize) =>
  queryInterface.createTable("ExpenseMembers", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    expense_id: {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: { model: "Expenses", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    user_id: {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: { model: "Users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    share_amount: {
      allowNull: false,
      type: Sequelize.DECIMAL(10, 2),
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(),
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: new Date(),
    },
  });

export const down = (queryInterface) =>
  queryInterface.dropTable("ExpenseMembers");
