import { Hono } from "hono";
import authRoutes from "./modules/auth/auth.routes";
import casesRoutes from "./modules/cases/cases.routes";

const router = new Hono();

router.route("/auth", authRoutes);
router.route("/cases", casesRoutes);

export default router;
