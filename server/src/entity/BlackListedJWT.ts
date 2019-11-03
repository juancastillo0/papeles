import { Entity, Column, BaseEntity, PrimaryColumn } from "typeorm";

@Entity()
export class BlackListedJWT extends BaseEntity {
  @PrimaryColumn({ update: false })
  token: string;

  @Column({ type: "integer", update: false })
  exp: number;
}
