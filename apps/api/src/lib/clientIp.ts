import type { Context } from "hono";
import { getConnInfo } from "hono/bun";
import { env } from "../env";

export const clientIp = (c: Context) => {
	const remote = getConnInfo(c).remote.address ?? "unknown";

	if (env.TRUSTED_PROXY_COUNT === 0) return remote;

	const parts = c.req.header("x-forwarded-for")?.split(",");

	if (!parts || parts.length < env.TRUSTED_PROXY_COUNT) return remote;

	return parts[parts.length - env.TRUSTED_PROXY_COUNT].trim() || remote;
};
