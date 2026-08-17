import { Hono } from "hono";

const authRoutes = new Hono();

authRoutes.post("/register", (c) => {
	return c.json({ ok: true, message: "register" });
});
authRoutes.post("/login", (c) => {
	return c.json({ ok: true, message: "login" });
});

export default authRoutes;
