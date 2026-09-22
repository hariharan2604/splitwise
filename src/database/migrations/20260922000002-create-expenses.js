"use strict";

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable("Expenses", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      value: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2),
      },
      currency: {
        allowNull: false,
        type: Sequelize.STRING(3),
      },
      date: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      paid_by: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      created_by: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      split_type: {
        allowNull: false,
        type: Sequelize.ENUM("EQUAL", "EXACT", "PERCENTAGE"),
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
    }),

  down: (queryInterface) => queryInterface.dropTable("Expenses"),
};
