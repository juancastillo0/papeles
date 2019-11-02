import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  Index,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn
} from "typeorm";
import { Field, ObjectType, registerEnumType, Int } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
export class Paper extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.papers)
  owner: User;

  @Field(() => [PaperPermission])
  @OneToMany(() => PaperPermission, permission => permission.paper)
  permissions: PaperPermission[];

  @Field(() => [PaperPath])
  @OneToMany(() => PaperPath, path => path.paper)
  paths: PaperPath[];

  @Field()
  @CreateDateColumn()
  createdDate: Date;
}

enum PaperPermissionType {
  "READ" = "READ",
  "WRITE" = "WRITE",
  "ADMIN" = "ADMIN"
}
registerEnumType(PaperPermissionType, { name: "PaperPermissionType" });

@ObjectType()
@Entity()
@Index(["user", "paper"], { unique: true })
export class PaperPermission extends BaseEntity {
  @Field(() => User)
  @ManyToOne(() => User, user => user.permissions, { primary: true })
  user: User;

  @Field(() => Paper)
  @ManyToOne(() => Paper, paper => paper.permissions, { primary: true })
  paper: Paper;

  @Field(() => PaperPermissionType)
  @Column()
  type: PaperPermissionType;
}

@ObjectType()
class PaperPathData {
  @Field(() => [Int])
  x: number[];
  @Field(() => [Int])
  y: number[];
  @Field(() => [Int])
  t: number[];
}

@ObjectType()
@Entity()
@Index(["paper", "device", "user", "id"], { unique: true })
export class PaperPath extends BaseEntity {
  @Field(() => String)
  @ManyToOne(() => Paper, paper => paper.paths, { primary: true })
  paper: Paper;

  @Field(() => User)
  @ManyToOne(() => User, { primary: true })
  user: User;

  @Field()
  @PrimaryColumn()
  device: string;

  @Field(() => Int)
  @PrimaryColumn({ unsigned: true })
  id: number;

  @Field(() => PaperPathData)
  @Column("jsonb")
  data: PaperPathData;
}
