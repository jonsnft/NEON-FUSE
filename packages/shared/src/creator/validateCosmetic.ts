import type { CosmeticCategory, CosmeticItem } from "../cosmetics/types";
import type { ApprovedCreatorCosmetic, CreatorCosmeticSubmission } from "./types";
import type { ValidationResult } from "./validateMap";

const ID = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const TOKEN = /^[a-z0-9][a-z0-9-]{0,47}$/;
const CATEGORIES = new Set<CosmeticCategory>(["avatar", "core", "blast", "trail", "victory"]);
const ALLOWED_KEYS = new Set([
  "id", "displayName", "description", "creatorId", "category", "visualToken", "requestedPriceShells"
]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function validateCreatorCosmetic(input: unknown): ValidationResult<CreatorCosmeticSubmission> {
  const errors: string[] = [];
  if (!isObject(input)) return { ok: false, errors: ["cosmetic must be an object"] };

  for (const key of Object.keys(input)) {
    if (!ALLOWED_KEYS.has(key)) errors.push(`unsupported field: ${key}`);
  }

  if (typeof input.id !== "string" || !ID.test(input.id)) errors.push("invalid cosmetic id");
  if (typeof input.creatorId !== "string" || !ID.test(input.creatorId)) errors.push("invalid creatorId");
  if (typeof input.displayName !== "string" || input.displayName.length < 1 || input.displayName.length > 80) {
    errors.push("displayName must be 1..80 characters");
  }
  if (typeof input.description !== "string" || input.description.length > 280) {
    errors.push("description must be at most 280 characters");
  }
  if (typeof input.category !== "string" || !CATEGORIES.has(input.category as CosmeticCategory)) {
    errors.push("invalid cosmetic category");
  }
  if (typeof input.visualToken !== "string" || !TOKEN.test(input.visualToken)) {
    errors.push("visualToken must be a safe slug of at most 48 characters");
  }
  if (typeof input.requestedPriceShells !== "number" ||
      !Number.isInteger(input.requestedPriceShells) ||
      input.requestedPriceShells < 1 ||
      input.requestedPriceShells > 100000) {
    errors.push("requestedPriceShells must be an integer between 1 and 100000");
  }

  return errors.length
    ? { ok: false, errors }
    : {
        ok: true,
        value: {
          id: input.id as string,
          displayName: input.displayName as string,
          description: input.description as string,
          creatorId: input.creatorId as string,
          category: input.category as CosmeticCategory,
          visualToken: input.visualToken as string,
          requestedPriceShells: input.requestedPriceShells as number
        },
        errors: []
      };
}

export function approveCreatorCosmetic(submission: CreatorCosmeticSubmission): ApprovedCreatorCosmetic {
  const item: CosmeticItem = {
    id: submission.id,
    category: submission.category,
    displayName: submission.displayName,
    description: submission.description,
    rarity: "CREATOR",
    creatorId: submission.creatorId,
    visualToken: submission.visualToken,
    price: { unit: "shells", amount: submission.requestedPriceShells },
    gameplayEffect: "none"
  };
  return { submission, item };
}
