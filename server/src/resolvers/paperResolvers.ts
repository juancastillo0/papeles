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

export function isOwnerOrAdmin({
  paperId,
  userId
}: {
  paperId: string;
  userId: string;
}): Promise<Paper | undefined> {
  return getConnection()
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
}

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
    @Arg("peerEmail") peerEmail: string,
    @Arg("permissionType", () => PaperPermissionType)
    permissionType: PaperPermissionType,
    @Ctx() context: RequestContext
  ): Promise<GenericError | null> {
    const userId = context.payload!.id;
    const paper = await isOwnerOrAdmin({ userId, paperId });

    if (!paper) return new GenericError("Not authorized");
    const peer = await User.findOne({
      where: { email: peerEmail.trim().toLowerCase() }
    });
    if (!peer)
      return new GenericError("No hay usuarios con el email especificado.");

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
    @Arg("id") id: string,
    @Arg("name") name: string,
    @Ctx() context: RequestContext
  ): Promise<Paper | null> {
    const userId = context.payload!.id;
    const paper = Paper.create({ name, ownerId: userId, id });

    try {
      await paper.save();
      return paper;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  @Mutation(() => GenericError, { nullable: true })
  @UseMiddleware(isAuth)
  async deletePaper(
    @Arg("paperId") paperId: string,
    @Ctx() context: RequestContext
  ) {
    const userId = context.payload!.id;
    const paper = await Paper.findOne({
      where: { id: paperId, ownerId: userId }
    });
    if (!paper) {
      return new GenericError("Not authorized");
    }

    try {
      await paper.remove();
      return null;
    } catch (e) {
      return new GenericError(e.message);
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
