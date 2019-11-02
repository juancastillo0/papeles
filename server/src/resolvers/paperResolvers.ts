import { UseMiddleware, Query, Resolver, Ctx } from "type-graphql";
import { isAuth } from "src/auth";
import { User } from "src/entity/User";
import { RequestContext } from "src";
import { Paper } from "src/entity/Paper";

@Resolver()
export class UserResolver {
  @Query(() => [Paper])
  @UseMiddleware(isAuth)
  papers(@Ctx() context: RequestContext) {
    return Paper.find({ where: { owner: { id: context.payload!.id } , permissions: {},} });
  }

  @Query(() => User)
  @UseMiddleware(isAuth)
  profile(@Ctx() context: RequestContext) {
    return User.findOne({ id: context.payload!.id });
  }
}
