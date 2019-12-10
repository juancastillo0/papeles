
import { ApolloClient, MutationOptions } from "apollo-client";
import { NormalizedCacheObject } from "apollo-cache-inmemory";
import {ProfileQuery,
  ProfileQueryVariables,
  ProfileDocument,
  LoginMutation,
  LoginMutationVariables,
  LoginDocument,
  RegisterMutation,
  RegisterMutationVariables,
  RegisterDocument,
  LogoutMutation,
  LogoutMutationVariables,
  LogoutDocument
  } from "../generated/graphql";
  
type OtherOptions<T, K> = Omit<MutationOptions<T, K>, "mutation" | "variables">;


export class AuthApi {
  constructor(public client: ApolloClient<NormalizedCacheObject>) {}

  mutate<T, K>(mutation: any) {
    return (variables: K, options: OtherOptions<T, K> = {}) =>
      this.client.mutate<T, K>({ mutation, variables, ...options });
  }

  query<T, K>(query: any) {
    return (variables: K, options: OtherOptions<T, K> = {}) =>
      this.client.query<T, K>({ query, variables, ...options });
  }

  profile = this.query<
    ProfileQuery,
    ProfileQueryVariables
  >(ProfileDocument);

  login = this.mutate<
    LoginMutation,
    LoginMutationVariables
  >(LoginDocument);

  register = this.mutate<
    RegisterMutation,
    RegisterMutationVariables
  >(RegisterDocument);

  logout = this.mutate<
    LogoutMutation,
    LogoutMutationVariables
  >(LogoutDocument);
}