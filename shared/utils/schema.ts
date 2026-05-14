import z from "zod";

const name = z
  .string("name is required")
  .min(3, "Name must be at least 3 characters long");

const description = z
  .string("description is required")
  .min(10, "Description must be at least 10 characters long");

const startId = z
  .number("startId is required")
  .int("startId must be an integer")
  .nonnegative("startId must be non-negative")
  .min(50000, "startId must be at least 50000")
  .max(999990, "startId must be at most 999990");

const endId = z
  .number("endId is required")
  .int("endId must be an integer")
  .nonnegative("endId must be non-negative")
  .min(50001, "endId must be at least 50001")
  .max(999999, "endId must be at most 999999");

const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(8, "Must be at least 8 characters"),
});

const userRole = z.object({
  role: z.enum(["admin", "developer"], "Role must be either 'admin' or 'developer'"),
});

const owner = z.string("owner is required").min(3, "Owner must be at least 3 characters long");

const environment = z
  .enum(["dev", "test", "prod"], "Environment is required");

const publisher = z
  .string("publisher is required")
  .min(3, "Publisher must be at least 3 characters long");

const rangeSchema = z.object({
  name,
  description,
  startId,
  endId,
  owner,
  publisher,
  environment,
});

const createRangeSchema = rangeSchema
  .refine(data => data.startId < data.endId, {
    message: "startId must be less than endId",
    path: ["startId", "endId"],
  });

const updateRangeSchema = rangeSchema.partial().refine((data) => {
  if (data.startId !== undefined && data.endId !== undefined) {
    return data.startId < data.endId;
  }
  return true;
});

const createAssignmentSchema = z.object({
  rangeId: z.string("rangeId is required"),
  objectId: z.number("objectId is required").int("objectId must be an integer").nonnegative("objectId must be non-negative"),
  objectName: z.string("objectName is required").min(3, "Object name must be at least 3 characters long"),
  objectType: z.enum([
    "Table",
    "Page",
    "Codeunit",
    "Report",
    "Enum",
    "Query",
    "XmlPort",
    "TableExtension",
    "PageExtension",
    "EnumExtension",
    "Interface",
    "PermissionSet",
    "Other",
  ]),
  assignedTo: z.string("assignedTo is required").min(3, "AssignedTo must be at least 3 characters long"),
  notes: z.string().optional(),
  status: z.enum(["in_use", "released", "reserved"]),
});

const updateAssignmentSchema = createAssignmentSchema.partial();

export type CreateRangeSchema = z.output<typeof createRangeSchema>;
export type UpdateRangeSchema = z.output<typeof updateRangeSchema>;

export type RangeFormSchema = CreateRangeSchema | UpdateRangeSchema;

export type UpdateAssignmentSchema = z.output<typeof updateAssignmentSchema>;

export {
  createAssignmentSchema,
  createRangeSchema,
  description,
  endId,
  loginSchema,
  name,
  owner,
  startId,
  updateAssignmentSchema,
  updateRangeSchema,
  userRole,
};
