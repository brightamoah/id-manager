import z from "zod";

const name = z.string("name is required").min(3, "Name must be at least 3 characters long");

const description = z.string("description is required").min(10, "Description must be at least 10 characters long");

const startId = z.number("startId is required").int("startId must be an integer").nonnegative("startId must be non-negative");

const endId = z.number("endId is required").int("endId must be an integer").nonnegative("endId must be non-negative");

const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(8, "Must be at least 8 characters"),
});

const userRole = z.object({
  role: z.enum(["admin", "developer"], "Role must be either 'admin' or 'developer'"),
});

const owner = z.string("owner is required").min(3, "Owner must be at least 3 characters long");

const environment = z.enum(["dev", "test", "prod"], "Environment must be one of 'dev', 'test', or 'prod'").default("dev");

const createRangeSchema = z.object({
  name,
  description,
  startId,
  endId,
  owner,
  publisher: z.string().optional(),
  environment,
});

const updateRangeSchema = createRangeSchema.partial();

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

export type CreateRangeInput = z.infer<typeof createRangeSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

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
