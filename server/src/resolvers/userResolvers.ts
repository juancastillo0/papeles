import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ObjectType,
  Field,
  registerEnumType,
  Ctx,
  UseMiddleware
} from "type-graphql";
import { hash, compare } from "bcryptjs";
import { User } from "../entity/User";
import { RequestContext } from "src";
import { setJWT, isAuth, invalidateJWT } from "../auth";

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

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return "HELLO";
  }

  @Query(() => [User])
  users() {
    return User.find();
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
    if (!rawPassword || rawPassword.length <= 2) {
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

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async logout(@Ctx() context: RequestContext) {
    invalidateJWT(context);
    return true;
  }
}
