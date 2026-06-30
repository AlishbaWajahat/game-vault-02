import { FieldType } from "@prisma/client";

interface FieldDefinition {
  slug: string;
  name: string;
  fieldType: FieldType;
  isRequired: boolean;
  options?: unknown;
  validation?: unknown;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDynamicFields(
  fields: Record<string, unknown>,
  definitions: FieldDefinition[]
): ValidationResult {
  const errors: string[] = [];

  for (const def of definitions) {
    const value = fields[def.slug];

    // Check required fields
    if (def.isRequired && (value === undefined || value === null || value === "")) {
      errors.push(`${def.name} is required`);
      continue;
    }

    // Skip validation if not provided and not required
    if (value === undefined || value === null) continue;

    // Type validation
    switch (def.fieldType) {
      case FieldType.TEXT:
      case FieldType.TEXTAREA:
      case FieldType.RICH_TEXT:
      case FieldType.URL:
      case FieldType.IMAGE:
      case FieldType.DATE:
        if (typeof value !== "string") {
          errors.push(`${def.name} must be a string`);
        }
        break;

      case FieldType.NUMBER:
      case FieldType.RATING:
        if (typeof value !== "number") {
          errors.push(`${def.name} must be a number`);
        } else {
          const v = def.validation as { min?: number; max?: number } | null;
          if (v?.min !== undefined && value < v.min) {
            errors.push(`${def.name} must be at least ${v.min}`);
          }
          if (v?.max !== undefined && value > v.max) {
            errors.push(`${def.name} must be at most ${v.max}`);
          }
        }
        break;

      case FieldType.BOOLEAN:
        if (typeof value !== "boolean") {
          errors.push(`${def.name} must be a boolean`);
        }
        break;

      case FieldType.SELECT:
        if (typeof value !== "string") {
          errors.push(`${def.name} must be a string`);
        } else if (def.options && Array.isArray(def.options)) {
          if (!def.options.includes(value)) {
            errors.push(`${def.name} must be one of: ${(def.options as string[]).join(", ")}`);
          }
        }
        break;

      case FieldType.MULTI_SELECT:
        if (!Array.isArray(value)) {
          errors.push(`${def.name} must be an array`);
        } else if (def.options && Array.isArray(def.options)) {
          const invalid = (value as string[]).filter((v) => !(def.options as string[]).includes(v));
          if (invalid.length > 0) {
            errors.push(`${def.name} contains invalid options: ${invalid.join(", ")}`);
          }
        }
        break;

      case FieldType.IMAGE_ARRAY:
      case FieldType.TEXT_ARRAY:
        if (!Array.isArray(value)) {
          errors.push(`${def.name} must be an array`);
        } else if (!value.every((v: unknown) => typeof v === "string")) {
          errors.push(`${def.name} must be an array of strings`);
        }
        break;
    }
  }

  return { valid: errors.length === 0, errors };
}
