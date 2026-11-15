import { NextResponse } from "next/server";
import {
  REFERRAL_COOKIE,
  REFERRAL_MAX_AGE,
  isValidReferral,
} from "@/lib/referral";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params;
  const url = new URL(req.url);
  const dest = new URL("/", url.origin);

  const res = NextResponse.redirect(dest);
  if (isValidReferral(code.toUpperCase())) {
    res.cookies.set(REFERRAL_COOKIE, code.toUpperCase(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: REFERRAL_MAX_AGE,
      path: "/",
    });
  }
  return res;
}
