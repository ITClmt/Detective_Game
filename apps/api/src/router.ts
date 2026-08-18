import { Hono } from "hono";
import authRoutes from "./modules/auth/auth.routes";

const router = new Hono();

router.route("/auth", authRoutes);

export default router;
