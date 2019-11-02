import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  Index,
  CreateDateColumn,
  OneToMany
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { Paper, PaperPermission } from "./Paper";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  static fromValues({
    name,
    email,
    password
  }: {
    name: string;
    email: string;
    password: string;
  }) {
    const user = new User();
    user.name = name;
    user.email = email;
    user.password = password;
    return user;
  }

  @Field()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  @Index({ unique: true })
  email: string;

  @Column()
  password: string;

  @Field()
  @CreateDateColumn()
  createdDate: Date;

  @Field(() => [Paper])
  @OneToMany(() => Paper, paper => paper.owner)
  papers: Paper[];

  @Field(() => [PaperPermission])
  @OneToMany(() => PaperPermission, permission => permission.user)
  permissions: PaperPermission[];
}
