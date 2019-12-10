import { Arg, createUnionType, Ctx, Field, InputType, Int, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { Brackets, getConnection, UpdateResult } from "typeorm";
import { isAuth } from "../auth";
import { Paper, PaperPath, PaperPathBox, PaperPathPoints, PaperPermissionType } from "../entity/Paper";
import { RequestContext } from "../index";
import { PaperSequenceNumberRecord } from "./paperResolvers";
import { GenericError, getRecord, hasAccessToPaper } from "./utils";

@InputType()
class PaperPathInput {
  @Field(() => Int)
  id: number;
  @Field(() => PaperPathPoints, { nullable: true })
  points?: PaperPathPoints;
  @Field()
  data: string;
  @Field(() => PaperPathBox)
  box: PaperPathBox;
}

@InputType()
class PaperPathDeleteInput {
  @Field(() => Int)
  id: number;
  @Field()
  userId: string;
  @Field()
  device: string;
}

@InputType()
class PaperPathUpdateInput {
  @Field(() => Int)
  id: number;
  @Field()
  userId: string;
  @Field()
  device: string;
  @Field(() => PaperPathBox)
  box: PaperPathBox;
}

@ObjectType()
class PaperPathRecord {
  @Field(() => Int)
  id: number;
  @Field()
  userId: string;
  @Field()
  device: string;
  @Field(() => Int)
  sequenceNumber: number;
}

@Resolver()
export class PaperPathResolver {
  @Mutation(() => GenericError, { nullable: true })
  @UseMiddleware(isAuth)
  async deletePaperPaths(
    @Arg("paperId") paperId: string,
    @Arg("paths", () => [PaperPathDeleteInput]) paths: PaperPathDeleteInput[],
    @Ctx() context: RequestContext
  ): Promise<GenericError | null> {
    if (paths.length === 0) {
      return null;
    }
    try {
      await getConnection().transaction("SERIALIZABLE", async entityManager => {
        const userId = context.payload!.id;
        const paper = await hasAccessToPaper({
          userId,
          paperId,
          minimum: PaperPermissionType.WRITE,
          entityManager
        });
        if (!paper) {
          throw new GenericError("Not authorized");
        }

        let updates: Promise<UpdateResult>[];
        let count = paper.sequenceNumber;
        try {
          updates = paths.map(path => {
            if (path.id < 0) {
              throw new Error("pathId should be grater than 0");
            }
            count += 1;
            return entityManager.update(
              PaperPath,
              {
                id: path.id,
                userId: path.userId,
                device: path.device,
                paperId
              },
              {
                sequenceNumber: count,
                data: null
              }
            );
          });
        } catch (e) {
          console.log(e);
          throw new GenericError(e.message);
        }
        paper.sequenceNumber = count;

        try {
          await entityManager.save(Paper, paper);
          await Promise.all(updates);

          return null;
        } catch (e) {
          console.log(e);
          throw new GenericError("Server Error");
        }
      });
      return null;
    } catch (e) {
      if (e instanceof GenericError) return e;
      throw e;
    }
  }

  @Mutation(() => GenericError, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePaperPaths(
    @Arg("paperId") paperId: string,
    @Arg("paths", () => [PaperPathUpdateInput]) paths: PaperPathUpdateInput[],
    @Ctx() context: RequestContext
  ): Promise<GenericError | null> {
    if (paths.length === 0) {
      return null;
    }
    try {
      await getConnection().transaction("SERIALIZABLE", async entityManager => {
        const userId = context.payload!.id;
        const paper = await hasAccessToPaper({
          userId,
          paperId,
          minimum: PaperPermissionType.WRITE,
          entityManager
        });
        if (!paper) {
          throw new GenericError("Not authorized");
        }

        let updates: Promise<UpdateResult>[];
        let count = paper.sequenceNumber;
        try {
          updates = paths.map(path => {
            if (path.id < 0) {
              throw new Error("pathId should be grater than 0");
            }
            count += 1;
            return entityManager.update(
              PaperPath,
              {
                id: path.id,
                userId: path.userId,
                device: path.device,
                paperId
              },
              {
                sequenceNumber: count,
                box: path.box
              }
            );
          });
        } catch (e) {
          throw new GenericError(e.message);
        }
        paper.sequenceNumber = count;

        try {
          await entityManager.save(Paper, paper);
          await Promise.all(updates);

          return null;
        } catch (e) {
          console.log(e);
          throw new GenericError("Server Error");
        }
      });
      return null;
    } catch (e) {
      if (e instanceof GenericError) return e;
      throw e;
    }
  }

  @Mutation(() => CreatePaperPathsResponse)
  @UseMiddleware(isAuth)
  async createPaperPaths(
    @Arg("paperId") paperId: string,
    @Arg("device") device: string,
    @Arg("paths", () => [PaperPathInput]) paths: PaperPathInput[],
    @Ctx() context: RequestContext
  ): Promise<typeof CreatePaperPathsResponse> {
    console.log(paths);
    if (paths.length === 0) {
      return new CreatePaperPathsResponseData([]);
    }
    try {
      const ans = await getConnection().transaction(
        "SERIALIZABLE",
        async entityManager => {
          const userId = context.payload!.id;
          const paperP = await hasAccessToPaper({
            userId,
            paperId,
            minimum: PaperPermissionType.WRITE,
            entityManager
          });
          if (!paperP) {
            throw new GenericError("Not authorized");
          }

          const { paper, record } = await getRecord({
            paper: paperP,
            device,
            userId,
            entityManager
          });
          const idsSet = new Set();
          let lastId = -1;
          let paperPaths: PaperPath[] = [];
          let count = paper.sequenceNumber;

          let ans: Array<PaperPathRecord> = [];
          const ansPromises: Array<() => Promise<
            PaperPathRecord | undefined
          >> = [];
          try {
            for (const path of paths) {
              if (path.id < 0) {
                throw new Error("pathId should be greater than 0");
              }
              if (idsSet.has(path.id)) {
                throw new Error("paths list contains duplicate ids");
              } else {
                idsSet.add(path.id);
                lastId = Math.max(lastId, path.id);
              }
              if (record.lastId > path.id) {
                continue;
              }
              count += 1;
              const paperRecord = {
                sequenceNumber: count,
                id: path.id,
                userId,
                device
              };
              ans.push(paperRecord);
              paperPaths.push(
                PaperPath.create({
                  data: path.data,
                  points: path.points,
                  box: path.box,
                  paperId,
                  ...paperRecord
                })
              );
            }
          } catch (e) {
            throw new GenericError(e.message);
          }

          const newRecording = paper.recording.filter(rec => {
            return rec.device !== device || rec.userId !== userId;
          });
          newRecording.push(record);
          paper.recording = newRecording;
          paper.sequenceNumber = count;

          try {
            const returnAns = await Promise.all(ansPromises.map(p => p()));
            if (returnAns.some(v => v === undefined)) {
              throw new GenericError("Bad request");
            } else {
              ans = ans.concat(...(returnAns as Array<PaperPathRecord>));
            }
            console.log(paperPaths, record);
            await entityManager.insert(PaperPath, paperPaths);
            await entityManager.save(Paper, paper);

            return ans;
          } catch (e) {
            console.log(e);
            throw new GenericError("Server Error");
          }
        }
      );
      return new CreatePaperPathsResponseData(ans);
    } catch (e) {
      if (e instanceof GenericError) return e;
      throw e;
    }
  }

  @Query(() => PaperPathsResponse)
  @UseMiddleware(isAuth)
  async paperPaths(
    @Arg("localPaths", () => [PaperSequenceNumberRecord])
    localPaths: PaperSequenceNumberRecord[],
    @Ctx() context: RequestContext
  ): Promise<PaperPathsResponse> {
    const userId = context.payload!.id;
    const promises: Array<() => Promise<Paper | undefined>> = [];
    const mapPaper: { [key: string]: PaperSequenceNumberRecord } = {};

    for (const paper of localPaths) {
      promises.push(() =>
        hasAccessToPaper({
          userId,
          paperId: paper.paperId,
          minimum: PaperPermissionType.READ
        })
      );
      mapPaper[paper.paperId] = paper;
    }

    try {
      const papers = await Promise.all(promises.map(p => p()));
      let q = PaperPath.createQueryBuilder("pp");
      let first = true;
      for (const paper of papers) {
        if (!paper) {
          throw new Error("Not authorized");
        }
        const record = mapPaper[paper.id];
        if (first) {
          q = q
            .where('pp."paperId" = :id', { id: paper.id })
            .andWhere('pp."sequenceNumber" > :seq', {
              seq: record.sequenceNumber
            });
          first = false;
        } else {
          q = q.orWhere(
            new Brackets(qq => {
              qq.where('pp."paperId" = :id', { id: paper.id }).andWhere(
                'pp."sequenceNumber" > :seq',
                {
                  seq: record.sequenceNumber
                }
              );
            })
          );
        }
      }

      const paperPaths = await q.getMany();
      console.log(paperPaths);
      return new PaperPathsResponse({ paperPaths });
    } catch (e) {
      console.log(e);
      throw new Error("Server error");
      // return new PaperPathsResponseError({ error: "Server Error" });
    }
  }
}

type PaperPathsResponseParams = {
  error: string;
  paperPaths: PaperPath[];
};

@ObjectType()
class PaperPathsResponse {
  constructor({ paperPaths }: Omit<PaperPathsResponseParams, "error">) {
    this.paperPathsAns = paperPaths;
  }
  @Field(() => [PaperPath])
  paperPathsAns: PaperPath[];
}
// @ObjectType()
// class PaperPathsResponseError {
//   constructor({ error }: Omit<PaperPathsResponseParams, "paperPaths">) {
//     this.error = error;
//   }
//   @Field()
//   error: string;
// }

// const PaperPathsResponseUnion = createUnionType({
//   name: "PaperPathsResponseOrError",
//   types: () => [PaperPathsResponse, PaperPathsResponseError],
//   resolveType: value => {
//     if ("error" in value) {
//       return PaperPathsResponseError;
//     }
//     if ("paperPathsAns" in value) {
//       return PaperPathsResponse;
//     }
//     return undefined;
//   }
// });

@ObjectType()
class CreatePaperPathsResponseData {
  constructor(paperPathRecords: PaperPathRecord[]) {
    this.paperPathRecords = paperPathRecords;
  }
  @Field(() => PaperPathRecord)
  paperPathRecords: PaperPathRecord[];
}

const CreatePaperPathsResponse = createUnionType({
  name: "CreatePaperPathsResponse",
  types: () => [CreatePaperPathsResponseData, GenericError],
  resolveType: value => {
    if ("error" in value) {
      return GenericError;
    }
    if ("paperPathRecords" in value) {
      return CreatePaperPathsResponseData;
    }
    return undefined;
  }
});
