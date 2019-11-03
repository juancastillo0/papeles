import { ObjectType, Field } from "type-graphql";
import { Paper, PaperRecording, PaperPermissionType, PaperPermission } from "../entity/Paper";
import { EntityManager, getManager, Brackets } from "typeorm";

@ObjectType()
export class GenericError {
  constructor(error: string) {
    this.error = error;
  }
  @Field()
  error: string;
}

export async function getRecord({
  paper,
  device,
  userId,
  entityManager
}: {
  paper: Paper;
  device: string;
  userId: string;
  entityManager?: EntityManager;
}): Promise<{ record: PaperRecording; paper: Paper }> {
  entityManager = entityManager || getManager();
  const records = paper.recording.filter(record => {
    return record.device === device && record.userId === userId;
  });
  let record;
  if (records.length === 0) {
    record = new PaperRecording({ device, userId, lastId: -1 });
  } else if (records.length === 1) {
    record = records[0];
  } else {
    record = records.reduce((prev, curr) => {
      if (prev.lastId > curr.lastId) {
        return prev;
      }
      return curr;
    }, records[0]);
    const newRecording = paper.recording.filter(record => {
      return record.device !== device || record.userId !== userId;
    });
    newRecording.push(record);
    paper.recording = newRecording;
    paper = await entityManager.save(Paper, paper);
  }
  return { record, paper };
}


export function hasAccessToPaper({
  userId,
  paperId,
  minimum,
  entityManager
}: {
  userId: string;
  paperId: string;
  minimum: PaperPermissionType;
  entityManager?: EntityManager;
}): Promise<Paper | undefined> {
  entityManager = entityManager || getManager();
  return entityManager
    .getRepository(Paper)
    .createQueryBuilder("p")
    .leftJoin(PaperPermission, "pp", 'pp."paperId" = p.id')
    .where("p.id = :paperId", { paperId })
    .andWhere(
      new Brackets(qb => {
        // Owner
        qb.where('p."ownerId" = :userId', { userId }).orWhere(
          new Brackets(qb2 => {
            // Permission
            qb2.where('pp."userId" = :userId', { userId }).andWhere(
              new Brackets(qb3 => {
                let added = false;
                const _addCond = (perm: PaperPermissionType) => {
                  const fn = added ? qb3.orWhere : qb3.where;
                  fn("pp.type = :perm", { perm });
                  added = true;
                };

                switch (minimum) {
                  //@ts-ignore
                  case PaperPermissionType.READ:
                    _addCond(PaperPermissionType.READ);
                  //@ts-ignore
                  case PaperPermissionType.WRITE:
                    _addCond(PaperPermissionType.WRITE);
                  case PaperPermissionType.ADMIN:
                    _addCond(PaperPermissionType.ADMIN);
                }
              })
            );
          })
        );
      })
    )
    .getOne();
}
