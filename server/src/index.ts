import "reflect-metadata";
import express, { Request, Response } from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/userResolvers";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";

const PORT = process.env.PORT || 4000;

export type RequestContext = {
  req: Request;
  res: Response;
  payload?: {id:string, email:string}
};

(async () => {
  await createConnection();
  const app = express();
  app.use(cookieParser());
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver]
    }),
    context: ({ req, res }) => ({ req, res })
  });

  apolloServer.applyMiddleware({ app });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
