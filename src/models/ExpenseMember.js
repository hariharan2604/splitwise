import Sequelize, { Model } from "sequelize";

class ExpenseMember extends Model {
  static init(sequelize) {
    super.init(
      {
        expense_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        share_amount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        is_paid: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      { sequelize, timestamps: true },
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Expense, { foreignKey: "expense_id" });
    this.belongsTo(models.User, { foreignKey: "user_id" });
  }
}

export default ExpenseMember;
