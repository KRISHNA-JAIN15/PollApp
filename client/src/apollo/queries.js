import { gql } from "@apollo/client";

// Get all polls query
export const GET_POLLS = gql`
  query GetPolls {
    polls {
      id
      question
      totalVotes
      createdAt
      createdBy {
        id
        name
        email
      }
      options {
        id
        text
        votesCount
        percentage
      }
    }
  }
`;

// Get user's polls query
export const GET_MY_POLLS = gql`
  query GetMyPolls {
    myPolls {
      id
      question
      totalVotes
      createdAt
      options {
        id
        text
        votesCount
        percentage
      }
    }
  }
`;

// Create poll mutation
export const CREATE_POLL = gql`
  mutation CreatePoll($input: CreatePollInput!) {
    createPoll(input: $input) {
      id
      question
      totalVotes
      createdAt
      createdBy {
        id
        name
        email
      }
      options {
        id
        text
        votesCount
      }
    }
  }
`;

// Vote mutation
export const VOTE_POLL = gql`
  mutation Vote($pollId: ID!, $optionId: ID!) {
    vote(pollId: $pollId, optionId: $optionId) {
      id
      option {
        id
        text
        poll {
          id
          question
        }
      }
    }
  }
`;

// Login mutation
export const LOGIN_USER = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      message
      token
      user {
        id
        name
        email
        isVerified
      }
    }
  }
`;

// Register mutation
export const REGISTER_USER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      success
      message
    }
  }
`;

// Verify email mutation
export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      success
      message
    }
  }
`;
