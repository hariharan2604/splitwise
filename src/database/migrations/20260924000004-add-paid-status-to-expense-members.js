export const up = (queryInterface, Sequelize) =>
  queryInterface.addColumn("ExpenseMembers", "is_paid", {
    allowNull: false,
    defaultValue: false,
    type: Sequelize.BOOLEAN,
  });

export const down = (queryInterface) =>
  queryInterface.removeColumn("ExpenseMembers", "is_paid");
