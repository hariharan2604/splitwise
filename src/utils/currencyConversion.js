import { BadRequestError } from "./ApiError.js";

const currencyMap = new Map([
  ["INR", 1],
  ["USD", 95],
  ["EUR", 110],
]);

export const normalizeCurrency = (currency) =>
  String(currency ?? "")
    .trim()
    .toUpperCase();

function toInR(source, value) {
  const normalizedSource = normalizeCurrency(source);

  if (!currencyMap.has(normalizedSource)) {
    throw new BadRequestError("Invalid Currency conversion");
  }

  return Number(value) * Number(currencyMap.get(normalizedSource));
}

export default {
  convertToINR: (source, value) => {
    return toInR(source, value);
  },

  convertToTarget: (source, target, value) => {
    const normalizedSource = normalizeCurrency(source);
    const normalizedTarget = normalizeCurrency(target);

    if (normalizedSource === normalizedTarget) {
      return Number(value);
    }

    if (
      !currencyMap.has(normalizedSource) ||
      !currencyMap.has(normalizedTarget)
    ) {
      throw new BadRequestError("Invalid Currency conversion");
    }

    const inrValue = Number(toInR(normalizedSource, value));
    return Number(inrValue / currencyMap.get(normalizedTarget));
  },
};
