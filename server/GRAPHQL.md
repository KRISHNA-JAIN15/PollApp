# GraphQL API Documentation

## Overview

This polling app backend now supports both REST API and GraphQL endpoints. The GraphQL endpoint provides a more flexible way to query and mutate data.

## GraphQL Endpoint

- **URL**: `http://localhost:3001/graphql`
- **Playground**: Available in development mode at the same URL

## Authentication

For protected operations, include the JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## Schema

### Types

#### User
```graphql
type User {
  id: ID!
  name: String!
  email: String!
  createdAt: String!
  polls: [Poll!]!
  votes: [Vote!]!
  pollsCount: Int!
  votesCount: Int!
}
```

#### Poll
```graphql
type Poll {
  id: ID!
  question: String!
  options: [Option!]!
  createdBy: User!
  createdAt: String!
  totalVotes: Int!
}
```

#### Option
```graphql
type Option {
  id: ID!
  text: String!
  votes: [Vote!]!
  votesCount: Int!
  percentage: Float!
}
```

#### Vote
```graphql
type Vote {
  id: ID!
  user: User!
  option: Option!
  createdAt: String!
}
```

### Queries

#### Get Current User (Protected)
```graphql
query Me {
  me {
    id
    name
    email
    pollsCount
    votesCount
  }
}
```

#### Get All Polls
```graphql
query GetPolls {
  polls {
    id
    question
    totalVotes
    createdAt
    createdBy {
      id
      name
    }
    options {
      id
      text
      votesCount
      percentage
    }
  }
}
```

#### Get Specific Poll
```graphql
query GetPoll($id: ID!) {
  poll(id: $id) {
    id
    question
    totalVotes
    createdBy {
      id
      name
    }
    options {
      id
      text
      votesCount
      percentage
    }
  }
}
```

#### Get Poll Results
```graphql
query GetPollResults($id: ID!) {
  pollResults(id: $id) {
    totalVotes
    poll {
      id
      question
      createdBy {
        name
      }
    }
    options {
      id
      text
      votes
      percentage
    }
  }
}
```

#### Get My Polls (Protected)
```graphql
query MyPolls {
  myPolls {
    id
    question
    totalVotes
    createdAt
    options {
      id
      text
      votesCount
    }
  }
}
```

#### Get My Votes (Protected)
```graphql
query MyVotes {
  myVotes {
    id
    createdAt
    option {
      id
      text
      poll {
        id
        question
        createdBy {
          name
        }
      }
    }
  }
}
```

#### Get User Statistics (Protected)
```graphql
query UserStats {
  userStats {
    pollsCreated
    votesCast
    totalVotesReceived
    mostPopularPoll {
      id
      question
      totalVotes
    }
  }
}
```

#### Get All Users
```graphql
query GetUsers {
  users {
    id
    name
    email
    pollsCount
    votesCount
    createdAt
  }
}
```

### Mutations

#### Register
```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    token
    user {
      id
      name
      email
    }
  }
}
```

Variables:
```json
{
  "input": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
}
```

#### Login
```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user {
      id
      name
      email
    }
  }
}
```

Variables:
```json
{
  "input": {
    "email": "john@example.com",
    "password": "password123"
  }
}
```

#### Logout
```graphql
mutation Logout {
  logout
}
```

#### Create Poll (Protected)
```graphql
mutation CreatePoll($input: CreatePollInput!) {
  createPoll(input: $input) {
    id
    question
    options {
      id
      text
    }
    createdBy {
      name
    }
  }
}
```

Variables:
```json
{
  "input": {
    "question": "What's your favorite programming language?",
    "options": ["JavaScript", "Python", "Java", "Go"]
  }
}
```

#### Vote (Protected)
```graphql
mutation Vote($pollId: ID!, $optionId: ID!) {
  vote(pollId: $pollId, optionId: $optionId) {
    id
    user {
      name
    }
    option {
      text
      poll {
        question
      }
    }
  }
}
```

Variables:
```json
{
  "pollId": "1",
  "optionId": "3"
}
```

#### Delete Poll (Protected)
```graphql
mutation DeletePoll($id: ID!) {
  deletePoll(id: $id)
}
```

Variables:
```json
{
  "id": "1"
}
```

## Example Usage

### Complete Authentication Flow

1. **Register a new user:**
```graphql
mutation {
  register(input: {
    name: "Alice Johnson"
    email: "alice@example.com"
    password: "securepassword"
  }) {
    token
    user {
      id
      name
      email
    }
  }
}
```

2. **Use the returned token for subsequent requests** by including it in headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Create a poll:**
```graphql
mutation {
  createPoll(input: {
    question: "Which is the best pizza topping?"
    options: ["Pepperoni", "Mushrooms", "Pineapple", "Margherita"]
  }) {
    id
    question
    options {
      id
      text
    }
  }
}
```

4. **Vote on the poll:**
```graphql
mutation {
  vote(pollId: "1", optionId: "2") {
    id
    option {
      text
    }
  }
}
```

5. **Get poll results:**
```graphql
query {
  pollResults(id: "1") {
    totalVotes
    options {
      text
      votes
      percentage
    }
  }
}
```

## Error Handling

GraphQL returns errors in a standardized format:

```json
{
  "errors": [
    {
      "message": "You must be logged in to perform this action",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

Common error codes:
- `UNAUTHENTICATED`: User not logged in
- `BAD_USER_INPUT`: Invalid input data
- `NOT_FOUND`: Resource not found
- `FORBIDDEN`: Insufficient permissions

## Development

To test GraphQL queries and mutations, you can:

1. Use the GraphQL Playground at `http://localhost:3001/graphql`
2. Use tools like Postman, Insomnia, or GraphiQL
3. Use the Apollo Client DevTools in your browser

The playground provides auto-completion, documentation, and query validation, making it easy to explore the API.
