
import { ApolloClient, MutationOptions } from "apollo-client";
import { NormalizedCacheObject } from "apollo-cache-inmemory";
import {CreatePaperPathsMutation,
  CreatePaperPathsMutationVariables,
  CreatePaperPathsDocument,
  DeletePaperPathsMutation,
  DeletePaperPathsMutationVariables,
  DeletePaperPathsDocument,
  UpdatePaperPathsMutation,
  UpdatePaperPathsMutationVariables,
  UpdatePaperPathsDocument,
  CreatePaperMutation,
  CreatePaperMutationVariables,
  CreatePaperDocument,
  PapersQuery,
  PapersQueryVariables,
  PapersDocument,
  PapersMetaQuery,
  PapersMetaQueryVariables,
  PapersMetaDocument,
  DeletePaperMutation,
  DeletePaperMutationVariables,
  DeletePaperDocument,
  CreatePaperPermissionMutation,
  CreatePaperPermissionMutationVariables,
  CreatePaperPermissionDocument,
  PaperPathsQuery,
  PaperPathsQueryVariables,
  PaperPathsDocument
  } from "../generated/graphql";
  
type OtherOptions<T, K> = Omit<MutationOptions<T, K>, "mutation" | "variables">;


export class CanvasApi {
  constructor(public client: ApolloClient<NormalizedCacheObject>) {}

  mutate<T, K>(mutation: any) {
    return (variables: K, options: OtherOptions<T, K> = {}) =>
      this.client.mutate<T, K>({ mutation, variables, ...options });
  }

  query<T, K>(query: any) {
    return (variables: K, options: OtherOptions<T, K> = {}) =>
      this.client.query<T, K>({ query, variables, ...options });
  }

  createPaperPaths = this.mutate<
    CreatePaperPathsMutation,
    CreatePaperPathsMutationVariables
  >(CreatePaperPathsDocument);

  deletePaperPaths = this.mutate<
    DeletePaperPathsMutation,
    DeletePaperPathsMutationVariables
  >(DeletePaperPathsDocument);

  updatePaperPaths = this.mutate<
    UpdatePaperPathsMutation,
    UpdatePaperPathsMutationVariables
  >(UpdatePaperPathsDocument);

  createPaper = this.mutate<
    CreatePaperMutation,
    CreatePaperMutationVariables
  >(CreatePaperDocument);

  papers = this.query<
    PapersQuery,
    PapersQueryVariables
  >(PapersDocument);

  papersMeta = this.query<
    PapersMetaQuery,
    PapersMetaQueryVariables
  >(PapersMetaDocument);

  deletePaper = this.mutate<
    DeletePaperMutation,
    DeletePaperMutationVariables
  >(DeletePaperDocument);

  createPaperPermission = this.mutate<
    CreatePaperPermissionMutation,
    CreatePaperPermissionMutationVariables
  >(CreatePaperPermissionDocument);

  paperPaths = this.query<
    PaperPathsQuery,
    PaperPathsQueryVariables
  >(PaperPathsDocument);
}