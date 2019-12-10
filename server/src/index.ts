import { ApolloServer } from "apollo-server-express";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import http from "http";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { startRemovingBlackListedTokens } from "./auth";
import { PaperPathResolver } from "./resolvers/paperPathResolver";
import { PaperModelResolver, PaperResolver } from "./resolvers/paperResolvers";
import { UserModelResolver, UserResolver } from "./resolvers/userResolvers";

const PORT = process.env.PORT || 4000;

export type RequestContext = {
  req: Request;
  res: Response;
  payload?: { id: string; email: string };
};

try {
  (async () => {
    await createConnection();
    startRemovingBlackListedTokens();

    const app = express();
    app.use(
      cors({
        origin: "http://localhost:3000",
        credentials: true
      })
    );
    app.use(cookieParser());
    const apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [
          UserResolver,
          PaperResolver,
          PaperModelResolver,
          UserModelResolver,
          PaperPathResolver
        ]
      }),
      context: ({ req, res }) => ({ req, res })
    });

    apolloServer.applyMiddleware({
      app,
      cors: false
    });

    const httpServer = http.createServer(app);
    apolloServer.installSubscriptionHandlers(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);  
    });
  })();
} catch (e) {
  console.error(e);  
}
