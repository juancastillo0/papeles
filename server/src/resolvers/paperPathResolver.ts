import {
  Resolver,
  InputType,
  Field,
  Int,
  Mutation,
  UseMiddleware,
  Arg,
  Ctx
} from "type-graphql";
import {
  PaperPathData,
  PaperPermissionType,
  PaperPath,
  Paper,
  PaperPathBox
} from "../entity/Paper";
import { isAuth } from "../auth";
import { GenericError, hasAccessToPaper, getRecord } from "./utils";
import { RequestContext } from "../index";
import { getConnection, UpdateResult } from "typeorm";

@InputType()
class PaperPathInput {
  @Field(() => Int)
  id: number;
  @Field(() => PaperPathData)
  points: PaperPathData;
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
      return new GenericError(e.message);
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
      return new GenericError(e.message);
    }
  }

  @Mutation(() => GenericError, { nullable: true })
  @UseMiddleware(isAuth)
  async createPaperPaths(
    @Arg("paperId") paperId: string,
    @Arg("device") device: string,
    @Arg("paths", () => [PaperPathInput]) paths: PaperPathInput[],
    @Ctx() context: RequestContext
  ): Promise<GenericError | null> {
    if (paths.length === 0) {
      return null;
    }
    return await getConnection().transaction(
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
          return new GenericError("Not authorized");
        }

        const { paper, record } = await getRecord({
          paper: paperP,
          device,
          userId,
          entityManager
        });
        const idsSet = new Set();
        let lastId = -1;
        let paperPaths: PaperPath[];
        let count = paper.sequenceNumber;
        try {
          paperPaths = paths
            .filter(path => {
              if (path.id < 0) {
                throw new Error("pathId should be grater than 0");
              }
              if (idsSet.has(path.id)) {
                throw new Error("paths list contains duplicate ids");
              } else {
                idsSet.add(path.id);
                lastId = Math.max(lastId, path.id);
              }
              return record.lastId < path.id;
            })
            .map(path => {
              count += 1;
              return PaperPath.create({
                sequenceNumber: count,
                id: path.id,
                userId,
                data: path.data,
                points: path.points,
                box: path.box,
                device,
                paperId
              });
            });
        } catch (e) {
          return new GenericError(e.message);
        }

        const newRecording = paper.recording.filter(rec => {
          return rec.device !== device || rec.userId !== userId;
        });
        newRecording.push(record);
        paper.recording = newRecording;
        paper.sequenceNumber = count;

        try {
          await entityManager.insert(PaperPath, paperPaths);
          await entityManager.save(Paper, paper);

          return null;
        } catch (e) {
          console.log(e);
          return new GenericError("Server Error");
        }
      }
    );
  }
}
