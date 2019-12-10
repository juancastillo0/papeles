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
  sdpMid?: Maybe<Scalars['String']>,
  sdpMLineIndex?: Maybe<Scalars['Int']>,
};

export type CandidateSignalDataInput = {
  candidate: Scalars['String'],
  sdpMid?: Maybe<Scalars['String']>,
  sdpMLineIndex?: Maybe<Scalars['Int']>,
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
  register: RegisterResponse,
  login: LoginResponse,
  logout?: Maybe<GenericError>,
  sendSignal?: Maybe<GenericError>,
  createPaperPermission?: Maybe<GenericError>,
  createPaper?: Maybe<Paper>,
  deletePaper?: Maybe<GenericError>,
  deletePaperPaths?: Maybe<GenericError>,
  updatePaperPaths?: Maybe<GenericError>,
  createPaperPaths?: Maybe<GenericError>,
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
  signal: SignalSent,
  peerId: Scalars['String']
};


export type MutationCreatePaperPermissionArgs = {
  permissionType: PaperPermissionType,
  peerEmail: Scalars['String'],
  paperId: Scalars['String']
};


export type MutationCreatePaperArgs = {
  name: Scalars['String'],
  id: Scalars['String']
};


export type MutationDeletePaperArgs = {
  paperId: Scalars['String']
};


export type MutationDeletePaperPathsArgs = {
  paths: Array<PaperPathDeleteInput>,
  paperId: Scalars['String']
};


export type MutationUpdatePaperPathsArgs = {
  paths: Array<PaperPathUpdateInput>,
  paperId: Scalars['String']
};


export type MutationCreatePaperPathsArgs = {
  paths: Array<PaperPathInput>,
  device: Scalars['String'],
  paperId: Scalars['String']
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
  recording: Array<PaperRecording>,
  sequenceNumber: Scalars['Int'],
};

export type PaperPath = {
   __typename?: 'PaperPath',
  paper: Scalars['String'],
  paperId: Scalars['String'],
  user: User,
  userId: Scalars['String'],
  device: Scalars['String'],
  id: Scalars['Int'],
  data?: Maybe<PaperPathData>,
  box: PaperPathBox,
  sequenceNumber: Scalars['Int'],
};

export type PaperPathBox = {
   __typename?: 'PaperPathBox',
  minX: Scalars['Float'],
  minY: Scalars['Float'],
  maxX: Scalars['Float'],
  maxY: Scalars['Float'],
};

export type PaperPathBoxInput = {
  minX: Scalars['Float'],
  minY: Scalars['Float'],
  maxX: Scalars['Float'],
  maxY: Scalars['Float'],
};

export type PaperPathData = {
   __typename?: 'PaperPathData',
  x: Array<Scalars['Float']>,
  y: Array<Scalars['Float']>,
  t: Array<Scalars['Int']>,
};

export type PaperPathDataInput = {
  x: Array<Scalars['Float']>,
  y: Array<Scalars['Float']>,
  t: Array<Scalars['Int']>,
};

export type PaperPathDeleteInput = {
  id: Scalars['Int'],
  userId: Scalars['String'],
  device: Scalars['String'],
};

export type PaperPathInput = {
  id: Scalars['Int'],
  data: PaperPathDataInput,
  box: PaperPathBoxInput,
};

export type PaperPathUpdateInput = {
  id: Scalars['Int'],
  userId: Scalars['String'],
  device: Scalars['String'],
  box: PaperPathBoxInput,
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

export type PaperRecording = {
   __typename?: 'PaperRecording',
  userId: Scalars['String'],
  device: Scalars['String'],
  lastId: Scalars['Int'],
};

export type Query = {
   __typename?: 'Query',
  users: Array<User>,
  userById?: Maybe<User>,
  userByEmail?: Maybe<User>,
  profile: User,
  papers: Array<Paper>,
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

export type SignalReceived = {
   __typename?: 'SignalReceived',
  userId: Scalars['String'],
  type: SignalType,
  sdp?: Maybe<Scalars['String']>,
  candidate?: Maybe<CandidateSignalData>,
};

export type SignalSent = {
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
  signals: SignalReceived,
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

export type CreatePaperPathsMutationVariables = {
  paths: Array<PaperPathInput>,
  device: Scalars['String'],
  paperId: Scalars['String']
};


export type CreatePaperPathsMutation = (
  { __typename?: 'Mutation' }
  & { createPaperPaths: Maybe<(
    { __typename?: 'GenericError' }
    & Pick<GenericError, 'error'>
  )> }
);

export type DeletePaperPathsMutationVariables = {
  paths: Array<PaperPathDeleteInput>,
  paperId: Scalars['String']
};


export type DeletePaperPathsMutation = (
  { __typename?: 'Mutation' }
  & { deletePaperPaths: Maybe<(
    { __typename?: 'GenericError' }
    & Pick<GenericError, 'error'>
  )> }
);

export type UpdatePaperPathsMutationVariables = {
  paths: Array<PaperPathUpdateInput>,
  paperId: Scalars['String']
};


export type UpdatePaperPathsMutation = (
  { __typename?: 'Mutation' }
  & { updatePaperPaths: Maybe<(
    { __typename?: 'GenericError' }
    & Pick<GenericError, 'error'>
  )> }
);

export type CreatePaperMutationVariables = {
  name: Scalars['String'],
  id: Scalars['String']
};


export type CreatePaperMutation = (
  { __typename?: 'Mutation' }
  & { createPaper: Maybe<(
    { __typename?: 'Paper' }
    & Pick<Paper, 'sequenceNumber' | 'name' | 'createdDate' | 'id'>
  )> }
);

export type PapersQueryVariables = {};


export type PapersQuery = (
  { __typename?: 'Query' }
  & { papers: Array<(
    { __typename?: 'Paper' }
    & Pick<Paper, 'id' | 'name' | 'ownerId' | 'sequenceNumber' | 'createdDate'>
    & { paths: Array<(
      { __typename?: 'PaperPath' }
      & Pick<PaperPath, 'userId' | 'device' | 'id' | 'sequenceNumber'>
      & { data: Maybe<(
        { __typename?: 'PaperPathData' }
        & Pick<PaperPathData, 'x' | 'y' | 't'>
      )>, box: (
        { __typename?: 'PaperPathBox' }
        & Pick<PaperPathBox, 'minX' | 'minY' | 'maxX' | 'maxY'>
      ) }
    )>, permissions: Array<(
      { __typename?: 'PaperPermission' }
      & Pick<PaperPermission, 'userId' | 'type'>
    )> }
  )> }
);

export type PapersMetaQueryVariables = {};


export type PapersMetaQuery = (
  { __typename?: 'Query' }
  & { papers: Array<(
    { __typename?: 'Paper' }
    & Pick<Paper, 'id' | 'name' | 'ownerId' | 'sequenceNumber' | 'createdDate'>
    & { permissions: Array<(
      { __typename?: 'PaperPermission' }
      & Pick<PaperPermission, 'userId' | 'type'>
    )> }
  )> }
);

export type DeletePaperMutationVariables = {
  paperId: Scalars['String']
};


export type DeletePaperMutation = (
  { __typename?: 'Mutation' }
  & { deletePaper: Maybe<(
    { __typename?: 'GenericError' }
    & Pick<GenericError, 'error'>
  )> }
);

export type CreatePaperPermissionMutationVariables = {
  permissionType: PaperPermissionType,
  peerEmail: Scalars['String'],
  paperId: Scalars['String']
};


export type CreatePaperPermissionMutation = (
  { __typename?: 'Mutation' }
  & { createPaperPermission: Maybe<(
    { __typename?: 'GenericError' }
    & Pick<GenericError, 'error'>
  )> }
);

export type SignalsSubscriptionVariables = {};


export type SignalsSubscription = (
  { __typename?: 'Subscription' }
  & { signals: (
    { __typename?: 'SignalReceived' }
    & Pick<SignalReceived, 'type' | 'sdp' | 'userId'>
    & { candidate: Maybe<(
      { __typename?: 'CandidateSignalData' }
      & Pick<CandidateSignalData, 'sdpMid' | 'candidate' | 'sdpMLineIndex'>
    )> }
  ) }
);

export type SendSdpSignalMutationVariables = {
  type: SignalType,
  sdp: Scalars['String'],
  peerId: Scalars['String']
};


export type SendSdpSignalMutation = (
  { __typename?: 'Mutation' }
  & { sendSignal: Maybe<(
    { __typename?: 'GenericError' }
    & Pick<GenericError, 'error'>
  )> }
);

export type SendCandidateSignalMutationVariables = {
  candidate: Scalars['String'],
  sdpMid?: Maybe<Scalars['String']>,
  sdpMLineIndex?: Maybe<Scalars['Int']>,
  peerId: Scalars['String']
};


export type SendCandidateSignalMutation = (
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
export const CreatePaperPathsDocument = gql`
    mutation CreatePaperPaths($paths: [PaperPathInput!]!, $device: String!, $paperId: String!) {
  createPaperPaths(paths: $paths, device: $device, paperId: $paperId) {
    error
  }
}
    `;
export type CreatePaperPathsMutationFn = ApolloReactCommon.MutationFunction<CreatePaperPathsMutation, CreatePaperPathsMutationVariables>;

/**
 * __useCreatePaperPathsMutation__
 *
 * To run a mutation, you first call `useCreatePaperPathsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePaperPathsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPaperPathsMutation, { data, loading, error }] = useCreatePaperPathsMutation({
 *   variables: {
 *      paths: // value for 'paths'
 *      device: // value for 'device'
 *      paperId: // value for 'paperId'
 *   },
 * });
 */
export function useCreatePaperPathsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreatePaperPathsMutation, CreatePaperPathsMutationVariables>) {
        return ApolloReactHooks.useMutation<CreatePaperPathsMutation, CreatePaperPathsMutationVariables>(CreatePaperPathsDocument, baseOptions);
      }
export type CreatePaperPathsMutationHookResult = ReturnType<typeof useCreatePaperPathsMutation>;
export type CreatePaperPathsMutationResult = ApolloReactCommon.MutationResult<CreatePaperPathsMutation>;
export type CreatePaperPathsMutationOptions = ApolloReactCommon.BaseMutationOptions<CreatePaperPathsMutation, CreatePaperPathsMutationVariables>;
export const DeletePaperPathsDocument = gql`
    mutation DeletePaperPaths($paths: [PaperPathDeleteInput!]!, $paperId: String!) {
  deletePaperPaths(paths: $paths, paperId: $paperId) {
    error
  }
}
    `;
export type DeletePaperPathsMutationFn = ApolloReactCommon.MutationFunction<DeletePaperPathsMutation, DeletePaperPathsMutationVariables>;

/**
 * __useDeletePaperPathsMutation__
 *
 * To run a mutation, you first call `useDeletePaperPathsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePaperPathsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePaperPathsMutation, { data, loading, error }] = useDeletePaperPathsMutation({
 *   variables: {
 *      paths: // value for 'paths'
 *      paperId: // value for 'paperId'
 *   },
 * });
 */
export function useDeletePaperPathsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeletePaperPathsMutation, DeletePaperPathsMutationVariables>) {
        return ApolloReactHooks.useMutation<DeletePaperPathsMutation, DeletePaperPathsMutationVariables>(DeletePaperPathsDocument, baseOptions);
      }
export type DeletePaperPathsMutationHookResult = ReturnType<typeof useDeletePaperPathsMutation>;
export type DeletePaperPathsMutationResult = ApolloReactCommon.MutationResult<DeletePaperPathsMutation>;
export type DeletePaperPathsMutationOptions = ApolloReactCommon.BaseMutationOptions<DeletePaperPathsMutation, DeletePaperPathsMutationVariables>;
export const UpdatePaperPathsDocument = gql`
    mutation UpdatePaperPaths($paths: [PaperPathUpdateInput!]!, $paperId: String!) {
  updatePaperPaths(paths: $paths, paperId: $paperId) {
    error
  }
}
    `;
export type UpdatePaperPathsMutationFn = ApolloReactCommon.MutationFunction<UpdatePaperPathsMutation, UpdatePaperPathsMutationVariables>;

/**
 * __useUpdatePaperPathsMutation__
 *
 * To run a mutation, you first call `useUpdatePaperPathsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePaperPathsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePaperPathsMutation, { data, loading, error }] = useUpdatePaperPathsMutation({
 *   variables: {
 *      paths: // value for 'paths'
 *      paperId: // value for 'paperId'
 *   },
 * });
 */
export function useUpdatePaperPathsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdatePaperPathsMutation, UpdatePaperPathsMutationVariables>) {
        return ApolloReactHooks.useMutation<UpdatePaperPathsMutation, UpdatePaperPathsMutationVariables>(UpdatePaperPathsDocument, baseOptions);
      }
export type UpdatePaperPathsMutationHookResult = ReturnType<typeof useUpdatePaperPathsMutation>;
export type UpdatePaperPathsMutationResult = ApolloReactCommon.MutationResult<UpdatePaperPathsMutation>;
export type UpdatePaperPathsMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdatePaperPathsMutation, UpdatePaperPathsMutationVariables>;
export const CreatePaperDocument = gql`
    mutation CreatePaper($name: String!, $id: String!) {
  createPaper(name: $name, id: $id) {
    sequenceNumber
    name
    createdDate
    id
  }
}
    `;
export type CreatePaperMutationFn = ApolloReactCommon.MutationFunction<CreatePaperMutation, CreatePaperMutationVariables>;

/**
 * __useCreatePaperMutation__
 *
 * To run a mutation, you first call `useCreatePaperMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePaperMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPaperMutation, { data, loading, error }] = useCreatePaperMutation({
 *   variables: {
 *      name: // value for 'name'
 *      id: // value for 'id'
 *   },
 * });
 */
export function useCreatePaperMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreatePaperMutation, CreatePaperMutationVariables>) {
        return ApolloReactHooks.useMutation<CreatePaperMutation, CreatePaperMutationVariables>(CreatePaperDocument, baseOptions);
      }
export type CreatePaperMutationHookResult = ReturnType<typeof useCreatePaperMutation>;
export type CreatePaperMutationResult = ApolloReactCommon.MutationResult<CreatePaperMutation>;
export type CreatePaperMutationOptions = ApolloReactCommon.BaseMutationOptions<CreatePaperMutation, CreatePaperMutationVariables>;
export const PapersDocument = gql`
    query Papers {
  papers {
    id
    name
    ownerId
    paths {
      userId
      device
      id
      data {
        x
        y
        t
      }
      box {
        minX
        minY
        maxX
        maxY
      }
      sequenceNumber
    }
    permissions {
      userId
      type
    }
    sequenceNumber
    createdDate
  }
}
    `;

/**
 * __usePapersQuery__
 *
 * To run a query within a React component, call `usePapersQuery` and pass it any options that fit your needs.
 * When your component renders, `usePapersQuery` returns an object from Apollo Client that contains loading, error, and data properties 
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePapersQuery({
 *   variables: {
 *   },
 * });
 */
export function usePapersQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<PapersQuery, PapersQueryVariables>) {
        return ApolloReactHooks.useQuery<PapersQuery, PapersQueryVariables>(PapersDocument, baseOptions);
      }
export function usePapersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PapersQuery, PapersQueryVariables>) {
          return ApolloReactHooks.useLazyQuery<PapersQuery, PapersQueryVariables>(PapersDocument, baseOptions);
        }
export type PapersQueryHookResult = ReturnType<typeof usePapersQuery>;
export type PapersLazyQueryHookResult = ReturnType<typeof usePapersLazyQuery>;
export type PapersQueryResult = ApolloReactCommon.QueryResult<PapersQuery, PapersQueryVariables>;
export const PapersMetaDocument = gql`
    query PapersMeta {
  papers {
    id
    name
    ownerId
    sequenceNumber
    createdDate
    permissions {
      userId
      type
    }
  }
}
    `;

/**
 * __usePapersMetaQuery__
 *
 * To run a query within a React component, call `usePapersMetaQuery` and pass it any options that fit your needs.
 * When your component renders, `usePapersMetaQuery` returns an object from Apollo Client that contains loading, error, and data properties 
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePapersMetaQuery({
 *   variables: {
 *   },
 * });
 */
export function usePapersMetaQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<PapersMetaQuery, PapersMetaQueryVariables>) {
        return ApolloReactHooks.useQuery<PapersMetaQuery, PapersMetaQueryVariables>(PapersMetaDocument, baseOptions);
      }
export function usePapersMetaLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PapersMetaQuery, PapersMetaQueryVariables>) {
          return ApolloReactHooks.useLazyQuery<PapersMetaQuery, PapersMetaQueryVariables>(PapersMetaDocument, baseOptions);
        }
export type PapersMetaQueryHookResult = ReturnType<typeof usePapersMetaQuery>;
export type PapersMetaLazyQueryHookResult = ReturnType<typeof usePapersMetaLazyQuery>;
export type PapersMetaQueryResult = ApolloReactCommon.QueryResult<PapersMetaQuery, PapersMetaQueryVariables>;
export const DeletePaperDocument = gql`
    mutation DeletePaper($paperId: String!) {
  deletePaper(paperId: $paperId) {
    error
  }
}
    `;
export type DeletePaperMutationFn = ApolloReactCommon.MutationFunction<DeletePaperMutation, DeletePaperMutationVariables>;

/**
 * __useDeletePaperMutation__
 *
 * To run a mutation, you first call `useDeletePaperMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePaperMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePaperMutation, { data, loading, error }] = useDeletePaperMutation({
 *   variables: {
 *      paperId: // value for 'paperId'
 *   },
 * });
 */
export function useDeletePaperMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeletePaperMutation, DeletePaperMutationVariables>) {
        return ApolloReactHooks.useMutation<DeletePaperMutation, DeletePaperMutationVariables>(DeletePaperDocument, baseOptions);
      }
export type DeletePaperMutationHookResult = ReturnType<typeof useDeletePaperMutation>;
export type DeletePaperMutationResult = ApolloReactCommon.MutationResult<DeletePaperMutation>;
export type DeletePaperMutationOptions = ApolloReactCommon.BaseMutationOptions<DeletePaperMutation, DeletePaperMutationVariables>;
export const CreatePaperPermissionDocument = gql`
    mutation CreatePaperPermission($permissionType: PaperPermissionType!, $peerEmail: String!, $paperId: String!) {
  createPaperPermission(permissionType: $permissionType, peerEmail: $peerEmail, paperId: $paperId) {
    error
  }
}
    `;
export type CreatePaperPermissionMutationFn = ApolloReactCommon.MutationFunction<CreatePaperPermissionMutation, CreatePaperPermissionMutationVariables>;

/**
 * __useCreatePaperPermissionMutation__
 *
 * To run a mutation, you first call `useCreatePaperPermissionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePaperPermissionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPaperPermissionMutation, { data, loading, error }] = useCreatePaperPermissionMutation({
 *   variables: {
 *      permissionType: // value for 'permissionType'
 *      peerEmail: // value for 'peerEmail'
 *      paperId: // value for 'paperId'
 *   },
 * });
 */
export function useCreatePaperPermissionMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreatePaperPermissionMutation, CreatePaperPermissionMutationVariables>) {
        return ApolloReactHooks.useMutation<CreatePaperPermissionMutation, CreatePaperPermissionMutationVariables>(CreatePaperPermissionDocument, baseOptions);
      }
export type CreatePaperPermissionMutationHookResult = ReturnType<typeof useCreatePaperPermissionMutation>;
export type CreatePaperPermissionMutationResult = ApolloReactCommon.MutationResult<CreatePaperPermissionMutation>;
export type CreatePaperPermissionMutationOptions = ApolloReactCommon.BaseMutationOptions<CreatePaperPermissionMutation, CreatePaperPermissionMutationVariables>;
export const SignalsDocument = gql`
    subscription Signals {
  signals {
    type
    sdp
    userId
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
    mutation SendSdpSignal($type: SignalType!, $sdp: String!, $peerId: String!) {
  sendSignal(peerId: $peerId, signal: {type: $type, sdp: $sdp}) {
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
 *      peerId: // value for 'peerId'
 *   },
 * });
 */
export function useSendSdpSignalMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SendSdpSignalMutation, SendSdpSignalMutationVariables>) {
        return ApolloReactHooks.useMutation<SendSdpSignalMutation, SendSdpSignalMutationVariables>(SendSdpSignalDocument, baseOptions);
      }
export type SendSdpSignalMutationHookResult = ReturnType<typeof useSendSdpSignalMutation>;
export type SendSdpSignalMutationResult = ApolloReactCommon.MutationResult<SendSdpSignalMutation>;
export type SendSdpSignalMutationOptions = ApolloReactCommon.BaseMutationOptions<SendSdpSignalMutation, SendSdpSignalMutationVariables>;
export const SendCandidateSignalDocument = gql`
    mutation SendCandidateSignal($candidate: String!, $sdpMid: String, $sdpMLineIndex: Int, $peerId: String!) {
  sendSignal(peerId: $peerId, signal: {type: candidate, candidate: {candidate: $candidate, sdpMid: $sdpMid, sdpMLineIndex: $sdpMLineIndex}}) {
    error
  }
}
    `;
export type SendCandidateSignalMutationFn = ApolloReactCommon.MutationFunction<SendCandidateSignalMutation, SendCandidateSignalMutationVariables>;

/**
 * __useSendCandidateSignalMutation__
 *
 * To run a mutation, you first call `useSendCandidateSignalMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendCandidateSignalMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendCandidateSignalMutation, { data, loading, error }] = useSendCandidateSignalMutation({
 *   variables: {
 *      candidate: // value for 'candidate'
 *      sdpMid: // value for 'sdpMid'
 *      sdpMLineIndex: // value for 'sdpMLineIndex'
 *      peerId: // value for 'peerId'
 *   },
 * });
 */
export function useSendCandidateSignalMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SendCandidateSignalMutation, SendCandidateSignalMutationVariables>) {
        return ApolloReactHooks.useMutation<SendCandidateSignalMutation, SendCandidateSignalMutationVariables>(SendCandidateSignalDocument, baseOptions);
      }
export type SendCandidateSignalMutationHookResult = ReturnType<typeof useSendCandidateSignalMutation>;
export type SendCandidateSignalMutationResult = ApolloReactCommon.MutationResult<SendCandidateSignalMutation>;
export type SendCandidateSignalMutationOptions = ApolloReactCommon.BaseMutationOptions<SendCandidateSignalMutation, SendCandidateSignalMutationVariables>;