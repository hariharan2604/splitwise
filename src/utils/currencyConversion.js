let currencyMap = new Map();
currencyMap.set("USD", 95);
currencyMap.set("EUR", 110);
import { BadRequestError } from "./ApiError.js";

function ToInR(source, value) {
  if (!currencyMap.has(source)) {
    throw new BadRequestError("Invalid Currency conversion");
  }
  return Number(value) * Number(currencyMap.get(source));
}
export default {
  convertToINR: (source, value) => {
    ToInR(source, value);
  },

  convertToTarget: (source, target, value) => {
    if (source === target)
      throw new BadRequestError("Invalid Currency conversion");
    if (!currencyMap.has(source) || !currencyMap.has(target)) {
      throw new BadRequestError("Invalid Currency conversion");
    }

    const INR_Value = Number(ToInR(source, value));

    const target_Value = Number(INR_Value / currencyMap.get(target));

    return target_Value;
  },
};
