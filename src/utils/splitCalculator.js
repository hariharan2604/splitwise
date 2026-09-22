import { BadRequestError } from "./ApiError";

const toCents = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new BadRequestError("Share values must be non-negative numbers");
  }
  return Math.round(number * 100);
};

const fromCents = (cents) => (cents / 100).toFixed(2);

export default function calculateShares(totalValue, splitType, members) {
  if (!Array.isArray(members) || members.length === 0) {
    throw new BadRequestError("At least one expense member is required");
  }

  const totalCents = toCents(totalValue);
  const userIds = members.map((member) => String(member.user_id));
  if (new Set(userIds).size !== userIds.length) {
    throw new BadRequestError("Expense members must be unique");
  }

  let shares;
  if (splitType === "EQUAL") {
    const base = Math.floor(totalCents / members.length);
    const remainder = totalCents - base * members.length;
    shares = members.map((member, index) => ({
      user_id: member.user_id,
      share_amount: fromCents(base + (index < remainder ? 1 : 0)),
    }));
  } else if (splitType === "EXACT") {
    shares = members.map((member) => ({
      user_id: member.user_id,
      share_amount: fromCents(toCents(member.share_amount ?? member.amount)),
    }));
  } else if (splitType === "PERCENTAGE") {
    const percentages = members.map((member) => Number(member.percentage));
    if (
      percentages.some(
        (percentage) => !Number.isFinite(percentage) || percentage < 0,
      )
    ) {
      throw new BadRequestError("Percentages must be non-negative numbers");
    }
    const percentageTotal = percentages.reduce(
      (sum, percentage) => sum + percentage,
      0,
    );
    if (Math.abs(percentageTotal - 100) > 0.0001) {
      throw new BadRequestError("Percentages must sum to 100");
    }
    shares = members.map((member, index) => ({
      user_id: member.user_id,
      share_amount: fromCents(
        Math.round((totalCents * percentages[index]) / 100),
      ),
    }));
  } else {
    throw new BadRequestError("Unsupported split type");
  }

  const shareTotal = shares.reduce(
    (sum, share) => sum + toCents(share.share_amount),
    0,
  );
  if (shareTotal !== totalCents) {
    throw new BadRequestError("Shares must sum to expense value");
  }

  return shares;
}
