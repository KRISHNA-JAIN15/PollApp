# PollApp

A RESTful API and GraphQL endpoint for a polling application where users can create polls, vote on them, and view results. Now includes email verification for enhanced security.

## Features

- User authentication with email verification
- Create polls with multiple options
- Vote on polls (one vote per user per poll)
- View poll results with statistics
- User profiles and statistics
- JWT-based authentication
- Email notifications (verification and welcome emails)
- Both REST API and GraphQL support

## Tech Stack

- Node.js with Express
- Prisma ORM with PostgreSQL
- JWT for authentication
- bcryptjs for password hashing
- Apollo Server for GraphQL
- Nodemailer for email functionality

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3001

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

3. Run Prisma migrations:
```bash
npm run prisma:migrate
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Start the server:
```bash
npm run dev  # Development mode with nodemon
npm start    # Production mode
```

## Authentication Flow

### 1. Registration with Email Verification

1. **Register**: User provides name, email, and password
2. **Email Sent**: Verification code sent to user's email
3. **Verify**: User enters the 6-digit verification code
4. **Welcome Email**: Welcome email sent upon successful verification
5. **Login**: User can now login with verified email

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new user and send verification email.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification code.",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "isVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "emailSent": true
}
```

#### POST `/api/auth/verify`
Verify user's email with verification code.

**Body:**
```json
{
  "email": "john@example.com",
  "verificationCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### POST `/api/auth/resend-verification`
Resend verification code to user's email.

**Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code resent successfully"
}
```

#### POST `/api/auth/login`
Login user (email must be verified).

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

**Error Response (Unverified Email):**
```json
{
  "success": false,
  "error": "Please verify your email before logging in",
  "needsVerification": true
}
```

### Polls

#### POST `/api/polls`
Create a new poll (requires authentication).

**Headers:**
```
Authorization: Bearer your_jwt_token
```

**Body:**
```json
{
  "question": "What's your favorite food?",
  "options": ["Pizza", "Burger", "Sushi", "Pasta"]
}
```

#### GET `/api/polls`
Get all polls.

#### GET `/api/polls/:id`
Get a specific poll by ID.

#### POST `/api/polls/:id/vote`
Vote on a poll (requires authentication).

**Headers:**
```
Authorization: Bearer your_jwt_token
```

**Body:**
```json
{
  "optionId": 1
}
```

#### GET `/api/polls/:id/results`
Get poll results with percentages.

#### GET `/api/polls/user/my-polls`
Get current user's polls (requires authentication).

#### GET `/api/polls/user/my-votes`
Get current user's votes (requires authentication).

#### DELETE `/api/polls/:id`
Delete a poll (only by creator, requires authentication).

### Users

#### GET `/api/users/profile`
Get current user's profile (requires authentication).

#### GET `/api/users/stats`
Get current user's statistics (requires authentication).

#### GET `/api/users`
Get all users.

## GraphQL API

### Endpoint
- **URL**: `http://localhost:3001/graphql`
- **Playground**: Available in development mode

### Authentication Mutations

#### Register
```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    success
    message
  }
}
```

#### Verify Email
```graphql
mutation VerifyEmail($input: VerifyEmailInput!) {
  verifyEmail(input: $input) {
    success
    message
  }
}
```

#### Resend Verification
```graphql
mutation ResendVerification($input: ResendVerificationInput!) {
  resendVerification(input: $input) {
    success
    message
  }
}
```

#### Login
```graphql
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
```

## Email Configuration

The app uses Gmail SMTP for sending emails. Configure your Gmail account:

1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in the `EMAIL_PASS` environment variable

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (validation errors, unverified email)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (email not verified, insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Email verification required for login
- Input validation and sanitization
- CORS protection

## Development

- Use `npm run dev` for development with auto-reload
- Use `npm run prisma:studio` to open Prisma Studio for database management
- Use `npm run prisma:migrate` when you change the schema
- Check `/graphql` endpoint for GraphQL playground in development mode

## Database Schema

- **User**: User accounts with email verification
- **Poll**: Poll questions created by users
- **Option**: Multiple choice options for each poll
- **Vote**: User votes on poll options (one vote per user per poll)

New fields in User model:
- `isVerified`: Boolean flag for email verification status
- `verificationCode`: 6-digit code for email verification
