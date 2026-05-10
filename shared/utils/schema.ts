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

export {
  description,
  endId,
  loginSchema,
  name,
  startId,
  userRole,
};
