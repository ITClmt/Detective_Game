import z from "zod";

const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters long").max(32, "Username must be at most 32 characters long"),
    email: z.email(),
    password: z.string().min(6, "Password must be at least 6 characters long").max(32, "Password must be at most 32 characters long").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/, "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"),
})

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(6, "Password must be at least 6 characters long").max(32, "Password must be at most 32 characters long").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/, "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character")
})

export { registerSchema, loginSchema }   