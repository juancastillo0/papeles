import { ApolloClient, MutationOptions } from "apollo-client";
import { NormalizedCacheObject } from "apollo-cache-inmemory";
import {
  CreatePaperMutation,
  CreatePaperMutationVariables,
  CreatePaperDocument,
  CreatePaperPathsMutation,
  CreatePaperPathsMutationVariables,
  CreatePaperPathsDocument,
  UpdatePaperPathsMutation,
  UpdatePaperPathsMutationVariables,
  UpdatePaperPathsDocument,
  DeletePaperPathsMutation,
  DeletePaperPathsMutationVariables,
  DeletePaperPathsDocument
} from "../generated/graphql";

type OtherOptions<T, K> = Omit<MutationOptions<T, K>, "mutation" | "variables">;

export class Api {
  constructor(public client: ApolloClient<NormalizedCacheObject>) {}

  mutate<T, K>(mutation: any) {
    return (variables: K, options: OtherOptions<T, K> = {}) =>
      this.client.mutate<T, K>({ mutation, variables, ...options });
  }
  query<T, K>(query: any) {
    return (variables: K, options: OtherOptions<T, K> = {}) =>
      this.client.query<T, K>({ query, variables, ...options });
  }
  subscribe<T, K>(query: any) {
    return (variables: K, options: OtherOptions<T, K> = {}) =>
      this.client.subscribe<T, K>({ query, variables, ...options });
  }

  createPaper = this.mutate<CreatePaperMutation, CreatePaperMutationVariables>(
    CreatePaperDocument
  );

  createPaperPaths = this.mutate<
    CreatePaperPathsMutation,
    CreatePaperPathsMutationVariables
  >(CreatePaperPathsDocument);

  updatePaperPaths = this.mutate<
    UpdatePaperPathsMutation,
    UpdatePaperPathsMutationVariables
  >(UpdatePaperPathsDocument);

  deletePaperPaths = this.mutate<
    DeletePaperPathsMutation,
    DeletePaperPathsMutationVariables
  >(DeletePaperPathsDocument);
}
