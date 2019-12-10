import { PubSubEngine } from "graphql-subscriptions";
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ObjectType,
  Field,
  registerEnumType,
  Ctx,
  UseMiddleware,
  Subscription,
  PubSub,
  InputType,
  Int,
  Root,
  ResolverInterface,
  FieldResolver
} from "type-graphql";
import { hash, compare } from "bcryptjs";
import { User } from "../entity/User";
import { RequestContext } from "../";
import { setJWT, isAuth, invalidateJWT } from "../auth";
import { Paper, PaperPermission } from "../entity/Paper";
import { GenericError } from "./utils";

enum RegisterResponseError {
  "BAD_EMAIL" = "BAD_EMAIL",
  "EMAIL_TAKEN" = "EMAIL_TAKEN",
  "BAD_PASSWORD" = "BAD_PASSWORD"
}
registerEnumType(RegisterResponseError, { name: "RegisterResponseError" });

@ObjectType()
class RegisterResponse {
  constructor({ user }: { user: User });
  constructor({ error }: { error: RegisterResponseError });
  constructor({ error, user }: { error: RegisterResponseError; user: User }) {
    this.error = error;
    this.user = user;
  }

  @Field({ nullable: true })
  user?: User;

  @Field(() => RegisterResponseError, { nullable: true })
  error?: RegisterResponseError;
}

enum LoginResponseError {
  "WRONG_EMAIL_OR_PASSWORD" = "WRONG_EMAIL_OR_PASSWORD",
  "NOT_FOUND" = "NOT_FOUND"
}
registerEnumType(LoginResponseError, {
  name: "LoginResponseError"
});

@ObjectType()
class LoginResponse {
  constructor({ user }: { user: User });
  constructor({ error }: { error: LoginResponseError });
  constructor({ error, user }: { error: LoginResponseError; user: User }) {
    this.error = error;
    this.user = user;
  }

  @Field({ nullable: true })
  user?: User;

  @Field(() => LoginResponseError, { nullable: true })
  error?: LoginResponseError;
}

enum SignalType {
  "offer" = "offer",
  "answer" = "answer",
  "candidate" = "candidate"
}
registerEnumType(SignalType, { name: "SignalType" });

@ObjectType()
@InputType("CandidateSignalDataInput")
class CandidateSignalData {
  @Field()
  candidate: string;
  @Field({ nullable: true })
  sdpMid?: string;
  @Field(() => Int, { nullable: true })
  sdpMLineIndex?: number;
}

@InputType()
class SignalSent {
  @Field(() => SignalType)
  type: SignalType;
  @Field({ nullable: true })
  sdp?: string;
  @Field({ nullable: true })
  candidate?: CandidateSignalData;
}
@ObjectType()
class SignalReceived {
  @Field()
  userId: string;
  @Field(() => SignalType)
  type: SignalType;
  @Field({ nullable: true })
  sdp?: string;
  @Field({ nullable: true })
  candidate?: CandidateSignalData;
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  users() {
    return User.find();
  }

  @Query(() => User, { nullable: true })
  userById(@Arg("id") id: string): Promise<User | undefined> {
    return User.findOne({ id });
  }

  @Query(() => User, { nullable: true })
  userByEmail(@Arg("email") email: string): Promise<User | undefined> {
    return User.findOne({ email });
  }

  @Query(() => User)
  @UseMiddleware(isAuth)
  profile(@Ctx() context: RequestContext) {
    return User.findOne({ id: context.payload!.id });
  }

  @Mutation(() => RegisterResponse)
  async register(
    @Arg("email") email: string,
    @Arg("password") rawPassword: string,
    @Arg("name") name: string,
    @Ctx() context: RequestContext
  ): Promise<RegisterResponse> {
    name = name
      .trim()
      .split(/\s+/)
      .join(" ");
    email = email.trim().toLowerCase();

    if (/\s/.test(email) || !/\./.test(email) || !/\@/.test(email)) {
      return new RegisterResponse({ error: RegisterResponseError.BAD_EMAIL });
    }
    if (!rawPassword) {
      return new RegisterResponse({
        error: RegisterResponseError.BAD_PASSWORD
      });
    }

    try {
      const password = await hash(rawPassword, 12);
      const user = User.fromValues({ name, email, password });
      await User.insert(user);
      // user.id = result.identifiers[0].id;

      setJWT(user, context.res);
      return new RegisterResponse({ user });
    } catch (e) {
      console.log(e);
      return new RegisterResponse({ error: RegisterResponseError.EMAIL_TAKEN });
    }
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg("email") email: string,
    @Arg("password") rawPassword: string,
    @Ctx() context: RequestContext
  ): Promise<LoginResponse> {
    email = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return new LoginResponse({ error: LoginResponseError.NOT_FOUND });
    }
    const valid = await compare(rawPassword, user.password);
    if (valid) {
      setJWT(user, context.res);
      return new LoginResponse({ user });
    } else {
      return new LoginResponse({
        error: LoginResponseError.WRONG_EMAIL_OR_PASSWORD
      });
    }
  }

  @Mutation(() => GenericError, { nullable: true })
  async logout(@Ctx() context: RequestContext): Promise<GenericError | null> {
    try {
      await invalidateJWT(context);
      return null;
    } catch (e) {
      return new GenericError("Server Error");
    }
  }

  /// ################# SIGNALS #################

  @UseMiddleware(isAuth)
  @Subscription(() => SignalReceived, {
    topics: ({ context }: { context: RequestContext }) => {
      return context.payload!.id;
    }
  })
  signals(@Root() signal: SignalReceived): SignalReceived {
    return signal;
  }

  @Mutation(() => GenericError, { nullable: true })
  @UseMiddleware(isAuth)
  async sendSignal(
    @PubSub() pubSub: PubSubEngine,
    @Arg("peerId") peerId: string,
    @Arg("signal") signal: SignalSent,
    @Ctx() context: RequestContext
  ): Promise<GenericError | null> {
    const userId = context.payload!.id;
    try {
      await pubSub.publish(peerId, { ...signal, userId } as SignalReceived);
      return null;
    } catch (e) {
      console.log(e);
      return new GenericError(e.message);
    }
  }
}

@Resolver(() => User)
export class UserModelResolver implements ResolverInterface<User> {
  @FieldResolver()
  async papers(@Root() user: User): Promise<Paper[]> {
    try {
      return await Paper.find({ where: { ownerId: user.id } });
    } catch (e) {
      console.log(e);
      throw Error();
    }
  }

  @FieldResolver()
  async permissions(@Root() user: User): Promise<PaperPermission[]> {
    try {
      return await PaperPermission.find({ where: { userId: user.id } });
    } catch (e) {
      console.log(e);
      throw Error();
    }
  }

  // @Query(() => [Paper])
  // @UseMiddleware(isAuth)
  // allPapers(@Ctx() context: RequestContext): Promise<Paper[]> {
  //   const userId = context.payload!.id;
  //   return getConnection()
  //     .getRepository(Paper)
  //     .createQueryBuilder("p")
  //     .leftJoinAndSelect(PaperPermission, "pp", 'pp."paperId" = p.id')
  //     .where('p."ownerId" = :userId', { userId })
  //     .orWhere('pp."userId" = :userId', { userId })
  //     .orderBy("p.name")
  //     .getMany();
  // }
}
