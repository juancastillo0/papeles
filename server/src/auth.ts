import { MiddlewareFn } from "type-graphql";
import { RequestContext } from "src";
import { User } from "./entity/User";
import { sign, verify } from "jsonwebtoken";
import { Response } from "express";

const TOKEN_SECRET = process.env.TOKEN_SECRET || "fefessdfc";
const _invalidJWTs = new Set<string>();

export function setJWT(user: User, res: Response) {
  const token = sign({ email: user.email, id: user.id }, TOKEN_SECRET, {
    expiresIn: "7 days"
  });
  res.cookie("jid", token, {
    secure: true,
    httpOnly: true,
    sameSite: "Lax"
  });
}

export function invalidateJWT(context: RequestContext) {
  _invalidJWTs.add(context.req.cookies.jid);
  context.res.clearCookie("jid");
}

export const isAuth: MiddlewareFn<RequestContext> = ({ context }, next) => {
  const token = context.req.cookies.jid;
  if (!token || _invalidJWTs.has(token)) throw Error("Not authenticated");

  try {
    const payload = verify(token, TOKEN_SECRET);
    context.payload = payload as any;
  } catch (e) {
    console.log(e);
    throw Error("Not authenticated");
  }

  return next();
};
