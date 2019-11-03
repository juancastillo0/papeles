import gql from 'graphql-tag';
import * as ApolloReactCommon from '@apollo/react-common';
import * as ApolloReactHooks from '@apollo/react-hooks';
export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string,
  String: string,
  Boolean: boolean,
  Int: number,
  Float: number,
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: any,
};

export type CandidateSignalData = {
   __typename?: 'CandidateSignalData',
  candidate: Scalars['String'],
  sdpMid: Scalars['String'],
  sdpMLineIndex: Scalars['Int'],
};

export type CandidateSignalDataInput = {
  candidate: Scalars['String'],
  sdpMid: Scalars['String'],
  sdpMLineIndex: Scalars['Int'],
};


export type GenericError = {
   __typename?: 'GenericError',
  error: Scalars['String'],
};

export type LoginResponse = {
   __typename?: 'LoginResponse',
  user?: Maybe<User>,
  error?: Maybe<LoginResponseError>,
};

export enum LoginResponseError {
  WrongEmailOrPassword = 'WRONG_EMAIL_OR_PASSWORD',
  NotFound = 'NOT_FOUND'
}

export type Mutation = {
   __typename?: 'Mutation',
  createPaperPermission?: Maybe<GenericError>,
  createPaper?: Maybe<Paper>,
  createPaperPath?: Maybe<GenericError>,
  register: RegisterResponse,
  login: LoginResponse,
  logout?: Maybe<GenericError>,
  sendSignal?: Maybe<GenericError>,
};


export type MutationCreatePaperPermissionArgs = {
  permissionType: PaperPermissionType,
  peerId: Scalars['String'],
  paperId: Scalars['String']
};


export type MutationCreatePaperArgs = {
  name: Scalars['String']
};


export type MutationCreatePaperPathArgs = {
  data: PaperPathDataInput,
  id: Scalars['Int'],
  device: Scalars['String'],
  paperId: Scalars['String']
};


export type MutationRegisterArgs = {
  name: Scalars['String'],
  password: Scalars['String'],
  email: Scalars['String']
};


export type MutationLoginArgs = {
  password: Scalars['String'],
  email: Scalars['String']
};


export type MutationSendSignalArgs = {
  signal: SignalInput
};

export type Paper = {
   __typename?: 'Paper',
  id: Scalars['String'],
  name: Scalars['String'],
  owner: User,
  ownerId: Scalars['String'],
  permissions: Array<PaperPermission>,
  paths: Array<PaperPath>,
  createdDate: Scalars['DateTime'],
};

export type PaperPath = {
   __typename?: 'PaperPath',
  paper: Scalars['String'],
  paperId: Scalars['String'],
  user: User,
  userId: Scalars['String'],
  device: Scalars['String'],
  id: Scalars['Int'],
  data: PaperPathData,
};

export type PaperPathData = {
   __typename?: 'PaperPathData',
  x: Array<Scalars['Int']>,
  y: Array<Scalars['Int']>,
  t: Array<Scalars['Int']>,
};

export type PaperPathDataInput = {
  x: Array<Scalars['Int']>,
  y: Array<Scalars['Int']>,
  t: Array<Scalars['Int']>,
};

export type PaperPermission = {
   __typename?: 'PaperPermission',
  user: User,
  userId: Scalars['String'],
  paper: Paper,
  paperId: Scalars['String'],
  type: PaperPermissionType,
};

export enum PaperPermissionType {
  Read = 'READ',
  Write = 'WRITE',
  Admin = 'ADMIN'
}

export type Query = {
   __typename?: 'Query',
  papers: Array<Paper>,
  users: Array<User>,
  userById?: Maybe<User>,
  userByEmail?: Maybe<User>,
  profile: User,
};


export type QueryUserByIdArgs = {
  id: Scalars['String']
};


export type QueryUserByEmailArgs = {
  email: Scalars['String']
};

export type RegisterResponse = {
   __typename?: 'RegisterResponse',
  user?: Maybe<User>,
  error?: Maybe<RegisterResponseError>,
};

export enum RegisterResponseError {
  BadEmail = 'BAD_EMAIL',
  EmailTaken = 'EMAIL_TAKEN',
  BadPassword = 'BAD_PASSWORD'
}

export type Signal = {
   __typename?: 'Signal',
  type: SignalType,
  sdp?: Maybe<Scalars['String']>,
  candidate?: Maybe<CandidateSignalData>,
};

export type SignalInput = {
  type: SignalType,
  sdp?: Maybe<Scalars['String']>,
  candidate?: Maybe<CandidateSignalDataInput>,
};

export enum SignalType {
  Offer = 'offer',
  Answer = 'answer',
  Candidate = 'candidate'
}

export type Subscription = {
   __typename?: 'Subscription',
  signals: Signal,
};

export type User = {
   __typename?: 'User',
  id: Scalars['String'],
  name: Scalars['String'],
  email: Scalars['String'],
  createdDate: Scalars['DateTime'],
  papers: Array<Paper>,
  permissions: Array<PaperPermission>,
};

export type ProfileQueryVariables = {};


export type ProfileQuery = (
  { __typename?: 'Query' }
  & { profile: (
    { __typename?: 'User' }
    & Pick<User, 'id' | 'email' | 'name'>
  ) }
);

export type LoginMutationVariables = {
  email: Scalars['String'],
  password: Scalars['String']
};


export type LoginMutation = (
  { __typename?: 'Mutation' }
  & { login: (
    { __typename?: 'LoginResponse' }
    & Pick<LoginResponse, 'error'>
    & { user: Maybe<(
      { __typename?: 'User' }
      & Pick<User, 'email' | 'name' | 'id'>
    )> }
  ) }
);

export type RegisterMutationVariables = {
  name: Scalars['String'],
  email: Scalars['String'],
  password: Scalars['String']
};


export type RegisterMutation = (
  { __typename?: 'Mutation' }
  & { register: (
    { __typename?: 'RegisterResponse' }
    & Pick<RegisterResponse, 'error'>
    & { user: Maybe<(
      { __typename?: 'User' }
      & Pick<User, 'email' | 'name' | 'id'>
    )> }
  ) }
);

export type LogoutMutationVariables = {};


export type LogoutMutation = (
  { __typename?: 'Mutation' }
  & { logout: Maybe<(
    { __typename?: 'GenericError' }
    & Pick<GenericError, 'error'>
  )> }
);

export type SignalsSubscriptionVariables = {};


export type SignalsSubscription = (
  { __typename?: 'Subscription' }
  & { signals: (
    { __typename?: 'Signal' }
    & Pick<Signal, 'type' | 'sdp'>
    & { candidate: Maybe<(
      { __typename?: 'CandidateSignalData' }
      & Pick<CandidateSignalData, 'sdpMid' | 'candidate' | 'sdpMLineIndex'>
    )> }
  ) }
);

export type SendSdpSignalMutationVariables = {
  type: SignalType,
  sdp: Scalars['String']
};


export type SendSdpSignalMutation = (
  { __typename?: 'Mutation' }
  & { sendSignal: Maybe<(
    { __typename?: 'GenericError' }
    & Pick<GenericError, 'error'>
  )> }
);

export type SendCandidateMutationVariables = {
  candidate: Scalars['String'],
  sdpMid: Scalars['String'],
  sdpMLineIndex: Scalars['Int']
};


export type SendCandidateMutation = (
  { __typename?: 'Mutation' }
  & { sendSignal: Maybe<(
    { __typename?: 'GenericError' }
    & Pick<GenericError, 'error'>
  )> }
);


export const ProfileDocument = gql`
    query Profile {
  profile {
    id
    email
    name
  }
}
    `;

/**
 * __useProfileQuery__
 *
 * To run a query within a React component, call `useProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties 
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProfileQuery({
 *   variables: {
 *   },
 * });
 */
export function useProfileQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<ProfileQuery, ProfileQueryVariables>) {
        return ApolloReactHooks.useQuery<ProfileQuery, ProfileQueryVariables>(ProfileDocument, baseOptions);
      }
export function useProfileLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ProfileQuery, ProfileQueryVariables>) {
          return ApolloReactHooks.useLazyQuery<ProfileQuery, ProfileQueryVariables>(ProfileDocument, baseOptions);
        }
export type ProfileQueryHookResult = ReturnType<typeof useProfileQuery>;
export type ProfileLazyQueryHookResult = ReturnType<typeof useProfileLazyQuery>;
export type ProfileQueryResult = ApolloReactCommon.QueryResult<ProfileQuery, ProfileQueryVariables>;
export const LoginDocument = gql`
    mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    user {
      email
      name
      id
    }
    error
  }
}
    `;
export type LoginMutationFn = ApolloReactCommon.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        return ApolloReactHooks.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, baseOptions);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = ApolloReactCommon.MutationResult<LoginMutation>;
export type LoginMutationOptions = ApolloReactCommon.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const RegisterDocument = gql`
    mutation Register($name: String!, $email: String!, $password: String!) {
  register(name: $name, email: $email, password: $password) {
    user {
      email
      name
      id
    }
    error
  }
}
    `;
export type RegisterMutationFn = ApolloReactCommon.MutationFunction<RegisterMutation, RegisterMutationVariables>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      name: // value for 'name'
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useRegisterMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RegisterMutation, RegisterMutationVariables>) {
        return ApolloReactHooks.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument, baseOptions);
      }
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = ApolloReactCommon.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = ApolloReactCommon.BaseMutationOptions<RegisterMutation, RegisterMutationVariables>;
export const LogoutDocument = gql`
    mutation Logout {
  logout {
    error
  }
}
    `;
export type LogoutMutationFn = ApolloReactCommon.MutationFunction<LogoutMutation, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *   },
 * });
 */
export function useLogoutMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LogoutMutation, LogoutMutationVariables>) {
        return ApolloReactHooks.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument, baseOptions);
      }
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = ApolloReactCommon.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = ApolloReactCommon.BaseMutationOptions<LogoutMutation, LogoutMutationVariables>;
export const SignalsDocument = gql`
    subscription Signals {
  signals {
    type
    sdp
    candidate {
      sdpMid
      candidate
      sdpMLineIndex
    }
  }
}
    `;

/**
 * __useSignalsSubscription__
 *
 * To run a query within a React component, call `useSignalsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useSignalsSubscription` returns an object from Apollo Client that contains loading, error, and data properties 
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSignalsSubscription({
 *   variables: {
 *   },
 * });
 */
export function useSignalsSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<SignalsSubscription, SignalsSubscriptionVariables>) {
        return ApolloReactHooks.useSubscription<SignalsSubscription, SignalsSubscriptionVariables>(SignalsDocument, baseOptions);
      }
export type SignalsSubscriptionHookResult = ReturnType<typeof useSignalsSubscription>;
export type SignalsSubscriptionResult = ApolloReactCommon.SubscriptionResult<SignalsSubscription>;
export const SendSdpSignalDocument = gql`
    mutation SendSDPSignal($type: SignalType!, $sdp: String!) {
  sendSignal(signal: {type: $type, sdp: $sdp}) {
    error
  }
}
    `;
export type SendSdpSignalMutationFn = ApolloReactCommon.MutationFunction<SendSdpSignalMutation, SendSdpSignalMutationVariables>;

/**
 * __useSendSdpSignalMutation__
 *
 * To run a mutation, you first call `useSendSdpSignalMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendSdpSignalMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendSdpSignalMutation, { data, loading, error }] = useSendSdpSignalMutation({
 *   variables: {
 *      type: // value for 'type'
 *      sdp: // value for 'sdp'
 *   },
 * });
 */
export function useSendSdpSignalMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SendSdpSignalMutation, SendSdpSignalMutationVariables>) {
        return ApolloReactHooks.useMutation<SendSdpSignalMutation, SendSdpSignalMutationVariables>(SendSdpSignalDocument, baseOptions);
      }
export type SendSdpSignalMutationHookResult = ReturnType<typeof useSendSdpSignalMutation>;
export type SendSdpSignalMutationResult = ApolloReactCommon.MutationResult<SendSdpSignalMutation>;
export type SendSdpSignalMutationOptions = ApolloReactCommon.BaseMutationOptions<SendSdpSignalMutation, SendSdpSignalMutationVariables>;
export const SendCandidateDocument = gql`
    mutation SendCandidate($candidate: String!, $sdpMid: String!, $sdpMLineIndex: Int!) {
  sendSignal(signal: {type: candidate, candidate: {candidate: $candidate, sdpMid: $sdpMid, sdpMLineIndex: $sdpMLineIndex}}) {
    error
  }
}
    `;
export type SendCandidateMutationFn = ApolloReactCommon.MutationFunction<SendCandidateMutation, SendCandidateMutationVariables>;

/**
 * __useSendCandidateMutation__
 *
 * To run a mutation, you first call `useSendCandidateMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendCandidateMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendCandidateMutation, { data, loading, error }] = useSendCandidateMutation({
 *   variables: {
 *      candidate: // value for 'candidate'
 *      sdpMid: // value for 'sdpMid'
 *      sdpMLineIndex: // value for 'sdpMLineIndex'
 *   },
 * });
 */
export function useSendCandidateMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SendCandidateMutation, SendCandidateMutationVariables>) {
        return ApolloReactHooks.useMutation<SendCandidateMutation, SendCandidateMutationVariables>(SendCandidateDocument, baseOptions);
      }
export type SendCandidateMutationHookResult = ReturnType<typeof useSendCandidateMutation>;
export type SendCandidateMutationResult = ApolloReactCommon.MutationResult<SendCandidateMutation>;
export type SendCandidateMutationOptions = ApolloReactCommon.BaseMutationOptions<SendCandidateMutation, SendCandidateMutationVariables>;