import { z } from "zod";
import { resources } from "../models/index.js";

const objectIdPattern = /^[a-f\d]{24}$/i;

function fieldValidator(path) {
  let validator;
  switch (path.instance) {
    case "String":
      validator = z.string();
      if (path.enumValues?.length) validator = validator.pipe(z.enum(path.enumValues));
      break;
    case "Number":
      validator = z.coerce.number().finite();
      break;
    case "Boolean":
      validator = z.union([z.boolean(), z.literal("true"), z.literal("false")])
        .transform((value) => value === true || value === "true");
      break;
    case "Date":
      validator = z.coerce.date();
      break;
    case "ObjectID":
      validator = z.string().regex(objectIdPattern, "Must be a valid record ID");
      break;
    case "Array": {
      const caster = path.caster;
      validator = z.array(caster?.instance === "ObjectID"
        ? z.string().regex(objectIdPattern, "Must be a valid record ID")
        : z.string());
      break;
    }
    default:
      validator = z.unknown();
  }
  return path.isRequired ? validator : validator.optional().nullable();
}

export function validateResource(req, res, next) {
  const Model = resources[req.params.resource];
  if (!Model) return next();
  const shape = {};
  for (const [key, path] of Object.entries(Model.schema.paths)) {
    if (!["_id", "id", "__v", "createdAt", "updatedAt"].includes(key)) {
      shape[key] = fieldValidator(path);
    }
  }
  const result = z.object(shape).strict().safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Request validation failed",
      errors: result.error.issues.map(({ path, message }) => ({ field: path.join("."), message })),
    });
  }
  req.validatedBody = result.data;
  next();
}
