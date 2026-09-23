import Sequelize, { Model } from "sequelize";

class Expense extends Model {
  static init(sequelize) {
    super.init(
      {
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        value: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        currency: {
          type: Sequelize.STRING(3),
          allowNull: false,
        },
        date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        paid_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        split_type: {
          type: Sequelize.ENUM("EQUAL", "EXACT", "PERCENTAGE"),
          allowNull: false,
        },
      },
      { sequelize, timestamps: true },
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { as: "payer", foreignKey: "paid_by" });
    this.belongsTo(models.User, { as: "creator", foreignKey: "created_by" });
    this.hasMany(models.ExpenseMember, { foreignKey: "expense_id" });
    this.belongsToMany(models.User, {
      through: models.ExpenseMember,
      foreignKey: "expense_id",
      otherKey: "user_id",
    });
  }
}

export default Expense;
