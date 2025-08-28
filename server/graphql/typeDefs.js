const gql = require("graphql-tag");

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    isVerified: Boolean!
    createdAt: String!
    polls: [Poll!]!
    votes: [Vote!]!
    pollsCount: Int!
    votesCount: Int!
  }

  type Poll {
    id: ID!
    question: String!
    description: String
    options: [Option!]!
    createdBy: User!
    createdAt: String!
    totalVotes: Int!
    userVote: Vote
  }

  type Option {
    id: ID!
    text: String!
    votes: [Vote!]!
    votesCount: Int!
    percentage: Float!
  }

  type Vote {
    id: ID!
    user: User!
    option: Option!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
    success: Boolean!
    message: String!
  }

  type VerificationResponse {
    success: Boolean!
    message: String!
  }

  type PollResult {
    poll: Poll!
    totalVotes: Int!
    options: [OptionResult!]!
  }

  type OptionResult {
    id: ID!
    text: String!
    votes: Int!
    percentage: Float!
  }

  type UserStats {
    pollsCreated: Int!
    votesCast: Int!
    totalVotesReceived: Int!
    mostPopularPoll: Poll
  }

  input CreatePollInput {
    question: String!
    options: [String!]!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input VerifyEmailInput {
    email: String!
    verificationCode: String!
  }

  input ResendVerificationInput {
    email: String!
  }

  type Query {
    # User queries
    me: User
    users: [User!]!
    userStats: UserStats

    # Poll queries
    polls: [Poll!]!
    poll(id: ID!): Poll
    pollResults(id: ID!): PollResult
    myPolls: [Poll!]!
    myVotes: [Vote!]!
  }

  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): VerificationResponse!
    verifyEmail(input: VerifyEmailInput!): VerificationResponse!
    resendVerification(input: ResendVerificationInput!): VerificationResponse!
    login(input: LoginInput!): AuthPayload!
    logout: String!

    # Poll mutations
    createPoll(input: CreatePollInput!): Poll!
    vote(pollId: ID!, optionId: ID!): Vote!
    deletePoll(id: ID!): String!
  }

  type Subscription {
    pollUpdated(pollId: ID!): Poll!
    newPoll: Poll!
    newVote(pollId: ID!): Vote!
  }
`;

module.exports = typeDefs;
