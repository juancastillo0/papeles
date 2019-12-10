import { GraphQLResolveInfo } from "graphql";
import { Arg, Args, ArgsType, createUnionType, Ctx, Field, FieldResolver, Info, InputType, Int, Mutation, Query, Resolver, ResolverInterface, Root, UseMiddleware } from "type-graphql";
import { Brackets, getConnection, MoreThan } from "typeorm";
import { RequestContext } from "../";
import { isAuth } from "../auth";
import { Paper, PaperPath, PaperPermission, PaperPermissionType } from "../entity/Paper";
import { User } from "../entity/User";
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

const CreatePaperPermissionResponse = createUnionType({
  name: "CreatePaperPermissionResponse",
  types: () => [PaperPermission, GenericError],
  resolveType: value => {
    if ("error" in value) {
      return GenericError;
    }
    if ("userId" in value) {
      return PaperPermission;
    }
    return undefined;
  }
});

@InputType()
export class PaperSequenceNumberRecord {
  @Field(() => Int)
  sequenceNumber: number;

  @Field()
  paperId: string;
}

@ArgsType()
export class PaperSequenceNumberRecords {
  @Field(() => [PaperSequenceNumberRecord], { nullable: true })
  localPapers?: PaperSequenceNumberRecord[];
}

@Resolver()
export class PaperResolver {
  @Query(() => [Paper])
  @UseMiddleware(isAuth)
  async papers(
    @Ctx() context: RequestContext,
    @Args() _: PaperSequenceNumberRecords
  ): Promise<Paper[]> {
    const userId = context.payload!.id;
    const ans = await  getConnection()
      .getRepository(Paper)
      .createQueryBuilder("p")
      .leftJoinAndSelect(PaperPermission, "pp", 'pp."paperId" = p.id')
      .where('p."ownerId" = :userId', { userId })
      .orWhere('pp."userId" = :userId', { userId })
      .orderBy("p.name")
      .getMany();
    console.log(ans);
    return ans;

    // if (localPapers) {
    //   const localPapersMap: { [key: string]: PaperSequenceNumberRecord } = {};
    //   for (const p of localPapers) {
    //     localPapersMap[p.paperId] = p;
    //   }
    //   ans = ans.filter(
    //     p =>
    //       !(p.id in localPapersMap) ||
    //       localPapersMap[p.id].sequenceNumber < p.sequenceNumber
    //   );
      

    // }

    // return ans;
  }

  @Mutation(() => CreatePaperPermissionResponse)
  @UseMiddleware(isAuth)
  async createPaperPermission(
    @Arg("paperId") paperId: string,
    @Arg("peerEmail") peerEmail: string,
    @Arg("permissionType", () => PaperPermissionType)
    permissionType: PaperPermissionType,
    @Ctx() context: RequestContext
  ): Promise<typeof CreatePaperPermissionResponse> {
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
        user: peer,
        userName: peer.name,
        userEmail: peer.email
      });
      return await permission.save();
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
    @Arg("createdDate", () => Date) createdDate: Date,
    @Ctx() context: RequestContext
  ): Promise<Paper | null> {
    const userId = context.payload!.id;
    console.log(id, name, createdDate);
    const paper = Paper.create({ name, ownerId: userId, id, createdDate });

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
  async paths(
    @Root() paper: Paper,
    @Info() info: GraphQLResolveInfo
  ): Promise<PaperPath[]> {
    let sequenceNumber = -1;
    console.log(info.variableValues);
    // const localPapers = info.variableValues[
    //   "localPapers"
    // ] as PaperSequenceNumberRecord[];
    // if (localPapers) {
    //   const localPaper = localPapers.find(v => v.paperId === paper.id);
    //   if (localPaper) {
    //     sequenceNumber = localPaper.sequenceNumber;
    //   }
    // }

    try {
      return await PaperPath.find({
        where: { paperId: paper.id, sequenceNumber: MoreThan(sequenceNumber) }
      });
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
