import { MiddlewareFn } from "type-graphql";
import { RequestContext } from "./index";
import { User } from "./entity/User";
import { sign, verify, decode } from "jsonwebtoken";
import { Response } from "express";
import { BlackListedJWT } from "./entity/BlackListedJWT";
import { getConnection } from "typeorm";

const TOKEN_SECRET = process.env.TOKEN_SECRET || "fefessdfc";

export function setJWT(user: User, res: Response) {
  const token = sign({ email: user.email, id: user.id }, TOKEN_SECRET, {
    expiresIn: "7 days"
  });
  res.cookie("jid", token, {
    // secure: true,
    httpOnly: true,
    sameSite: "Lax"
  });
}

export async function invalidateJWT(context: RequestContext) {
  const token = context.req.cookies.jid;
  if (!token) {
    return;
  }
  const payload = decode(token) as any;
  await BlackListedJWT.save(BlackListedJWT.create({ token, exp: payload.exp }));
  context.res.clearCookie("jid");
}

export const isAuth: MiddlewareFn<RequestContext> = async (
  { context },
  next
) => {
  const token = context.req.cookies.jid;
  if (!token || (await BlackListedJWT.findOne({ token })) !== undefined)
    throw Error("Not authenticated");

  try {
    const payload = verify(token, TOKEN_SECRET);
    context.payload = payload as any;
  } catch (e) {
    console.log(e);
    throw Error("Not authenticated");
  }

  return next();
};

export function startRemovingBlackListedTokens() {
  const _deleteTokens = () => {
    getConnection()
      .createQueryBuilder()
      .delete()
      .from(BlackListedJWT)
      .where("exp < :curr", { curr: Math.floor(Date.now() / 1000) })
      .execute();
  };
  _deleteTokens();
  setTimeout(_deleteTokens, 60 * 60 * 1000 * 2);
}
