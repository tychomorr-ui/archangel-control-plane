import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { parse as parseCookieHeader } from "cookie";
import { isLocalAuthConfigured, LOCAL_AUTH_COOKIE, verifyLocalSession } from "./localAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const localToken = parseCookieHeader(opts.req.headers.cookie ?? "")[LOCAL_AUTH_COOKIE];
    const localSession = await verifyLocalSession(localToken);
    if (localSession) {
      const now = new Date();
      user = {
        id: -1,
        openId: `local:${localSession.username}`,
        name: localSession.name,
        email: null,
        loginMethod: "archangel-local",
        role: "admin",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      } as User;
    } else if (!isLocalAuthConfigured()) {
      // Fail closed when first-party auth is not configured. Manus OAuth is
      // intentionally not a fallback for the ARCHANGEL operator console.
      user = null;
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
