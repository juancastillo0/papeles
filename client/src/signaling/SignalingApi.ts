
import { ApolloClient, MutationOptions } from "apollo-client";
import { NormalizedCacheObject } from "apollo-cache-inmemory";
import {SignalsSubscription,
  SignalsSubscriptionVariables,
  SignalsDocument,
  SendSdpSignalMutation,
  SendSdpSignalMutationVariables,
  SendSdpSignalDocument,
  SendCandidateSignalMutation,
  SendCandidateSignalMutationVariables,
  SendCandidateSignalDocument
  } from "../generated/graphql";
  
type OtherOptions<T, K> = Omit<MutationOptions<T, K>, "mutation" | "variables">;


export class SignalingApi {
  constructor(public client: ApolloClient<NormalizedCacheObject>) {}

  mutate<T, K>(mutation: any) {
    return (variables: K, options: OtherOptions<T, K> = {}) =>
      this.client.mutate<T, K>({ mutation, variables, ...options });
  }

  subscribe<T, K>(query: any) {
    return (variables: K, options: OtherOptions<T, K> = {}) =>
      this.client.subscribe<T, K>({ query, variables, ...options });
  }

  signals = this.subscribe<
    SignalsSubscription,
    SignalsSubscriptionVariables
  >(SignalsDocument);

  sendSdpSignal = this.mutate<
    SendSdpSignalMutation,
    SendSdpSignalMutationVariables
  >(SendSdpSignalDocument);

  sendCandidateSignal = this.mutate<
    SendCandidateSignalMutation,
    SendCandidateSignalMutationVariables
  >(SendCandidateSignalDocument);
}