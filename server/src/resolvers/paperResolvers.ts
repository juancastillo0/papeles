import {
  UseMiddleware,
  Query,
  Resolver,
  Ctx,
  Mutation,
  Arg,
  ResolverInterface,
  FieldResolver,
  Root
} from "type-graphql";
import { isAuth } from "../auth";
import { User } from "../entity/User";
import { RequestContext } from "../";
import {
  Paper,
  PaperPermissionType,
  PaperPermission,
  PaperPath
} from "../entity/Paper";
import { getConnection, Brackets } from "typeorm";
import { GenericError } from "./utils";

@Resolver()
export class PaperResolver {
  @Query(() => [Paper])
  @UseMiddleware(isAuth)
  papers(@Ctx() context: RequestContext): Promise<Paper[]> {
    const userId = context.payload!.id;
    return getConnection()
      .getRepository(Paper)
      .createQueryBuilder("p")
      .leftJoinAndSelect(PaperPermission, "pp", 'pp."paperId" = p.id')
      .where('p."ownerId" = :userId', { userId })
      .orWhere('pp."userId" = :userId', { userId })
      .orderBy("p.name")
      .getMany();
  }

  @Mutation(() => GenericError, { nullable: true })
  @UseMiddleware(isAuth)
  async createPaperPermission(
    @Arg("paperId") paperId: string,
    @Arg("peerId") peerId: string,
    @Arg("permissionType", () => PaperPermissionType)
    permissionType: PaperPermissionType,
    @Ctx() context: RequestContext
  ): Promise<GenericError | null> {
    const userId = context.payload!.id;
    const paper = await getConnection()
      .getRepository(Paper)
      .createQueryBuilder("p")
      .leftJoin(PaperPermission, "pp", 'pp."paperId" = p.id')
      .where("p.id = :paperId", { paperId })
      .andWhere(
        new Brackets(qb => {
          qb.where('p."ownerId" = :userId', { userId }).orWhere(
            new Brackets(qb2 => {
              qb2
                .where('pp."userId" = :userId', { userId })
                .andWhere("pp.type = :permissionType", {
                  permissionType: PaperPermissionType.ADMIN
                });
            })
          );
        })
      )
      .getOne();

    if (!paper)
      return new GenericError("Paper doesn't exist or you don't have access");
    const peer = await User.findOne({ where: { id: peerId } });
    if (!peer) return new GenericError("Peer doesn't exist");

    try {
      const permission = PaperPermission.create({
        paper: paper,
        type: permissionType,
        user: peer
      });
      await permission.save();
      return null;
    } catch (e) {
      console.log(e);
    }
    return new GenericError("Server Error");
  }

  @Mutation(() => Paper, { nullable: true })
  @UseMiddleware(isAuth)
  async createPaper(
    @Arg("name") name: string,
    @Ctx() context: RequestContext
  ): Promise<Paper | null> {
    const userId = context.payload!.id;
    const paper = Paper.create({ name, owner: User.create({ id: userId }) });

    try {
      await paper.save();
      return paper;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}


@Resolver(() => Paper)
export class PaperModelResolver implements ResolverInterface<Paper> {
  @FieldResolver()
  async owner(@Root() paper: Paper): Promise<User> {
    try {
      const user = await User.findOne({ where: { id: paper.ownerId } });
      if (user) return user;
    } catch (e) {
      console.log(e);
    }
    throw Error();
  }

  @FieldResolver()
  async paths(@Root() paper: Paper): Promise<PaperPath[]> {
    try {
      return await PaperPath.find({ where: { paperId: paper.id } });
    } catch (e) {
      console.log(e);
      throw Error();
    }
  }

  @FieldResolver()
  async permissions(@Root() paper: Paper): Promise<PaperPermission[]> {
    try {
      return await PaperPermission.find({ where: { paperId: paper.id } });
    } catch (e) {
      console.log(e);
      throw Error();
    }
  }
}
