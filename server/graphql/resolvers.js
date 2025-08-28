const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("../generated/prisma");
const { GraphQLError } = require("graphql");
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  generateVerificationCode,
} = require("../utils/emailService");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const requireAuth = (user) => {
  if (!user) {
    throw new GraphQLError("You must be logged in to perform this action", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return user;
};

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      const user = requireAuth(context.user);

      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          polls: {
            include: {
              options: {
                include: {
                  _count: { select: { votes: true } },
                },
              },
              createdBy: true,
            },
          },
          votes: {
            include: {
              option: {
                include: {
                  poll: true,
                },
              },
            },
          },
          _count: {
            select: { polls: true, votes: true },
          },
        },
      });

      if (!userData) {
        throw new GraphQLError("User not found");
      }

      return {
        ...userData,
        pollsCount: userData._count.polls,
        votesCount: userData._count.votes,
      };
    },

    users: async () => {
      return await prisma.user.findMany({
        include: {
          _count: {
            select: { polls: true, votes: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    },

    userStats: async (parent, args, context) => {
      const user = requireAuth(context.user);

      const pollsCount = await prisma.poll.count({
        where: { userId: user.id },
      });
      const votesCount = await prisma.vote.count({
        where: { userId: user.id },
      });

      const totalVotesReceived = await prisma.vote.count({
        where: {
          option: {
            poll: { userId: user.id },
          },
        },
      });

      const pollsWithVotes = await prisma.poll.findMany({
        where: { userId: user.id },
        include: {
          options: {
            include: {
              _count: { select: { votes: true } },
            },
          },
          createdBy: true,
        },
      });

      const pollsWithTotalVotes = pollsWithVotes.map((poll) => ({
        ...poll,
        totalVotes: poll.options.reduce(
          (sum, option) => sum + option._count.votes,
          0
        ),
      }));

      const mostPopularPoll = pollsWithTotalVotes.reduce(
        (prev, current) =>
          prev.totalVotes > current.totalVotes ? prev : current,
        { totalVotes: 0 }
      );

      return {
        pollsCreated: pollsCount,
        votesCast: votesCount,
        totalVotesReceived,
        mostPopularPoll:
          mostPopularPoll.totalVotes > 0 ? mostPopularPoll : null,
      };
    },

    polls: async (parent, args, context) => {
      const user = context.user; // Get user if authenticated

      const whereCondition = user
        ? { userId: { not: user.id } } // Exclude user's own polls if authenticated
        : {}; // Show all polls if not authenticated

      const polls = await prisma.poll.findMany({
        where: whereCondition,
        include: {
          options: {
            include: {
              _count: { select: { votes: true } },
              votes: user ? { where: { userId: user.id } } : false,
            },
          },
          createdBy: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return polls.map((poll) => {
        let userVote = null;
        if (user) {
          // Find the user's vote across all options
          for (const option of poll.options) {
            if (option.votes && option.votes.length > 0) {
              const vote = option.votes[0];
              userVote = {
                ...vote,
                createdAt: vote.createdAt.toISOString(),
                option: {
                  id: option.id,
                  text: option.text,
                  pollId: poll.id,
                },
              };
              break;
            }
          }
        }

        return {
          ...poll,
          createdAt: poll.createdAt.toISOString(),
          totalVotes: poll.options.reduce(
            (sum, option) => sum + option._count.votes,
            0
          ),
          userVote,
        };
      });
    },

    poll: async (parent, { id }) => {
      const poll = await prisma.poll.findUnique({
        where: { id: parseInt(id) },
        include: {
          options: {
            include: {
              _count: { select: { votes: true } },
              votes: {
                include: { user: true },
              },
            },
          },
          createdBy: true,
        },
      });

      if (!poll) {
        throw new GraphQLError("Poll not found");
      }

      return {
        ...poll,
        createdAt: poll.createdAt.toISOString(),
        totalVotes: poll.options.reduce(
          (sum, option) => sum + option._count.votes,
          0
        ),
      };
    },

    pollResults: async (parent, { id }) => {
      const poll = await prisma.poll.findUnique({
        where: { id: parseInt(id) },
        include: {
          options: {
            include: {
              _count: { select: { votes: true } },
            },
          },
          createdBy: true,
        },
      });

      if (!poll) {
        throw new GraphQLError("Poll not found");
      }

      const totalVotes = poll.options.reduce(
        (sum, option) => sum + option._count.votes,
        0
      );

      return {
        poll: {
          ...poll,
          totalVotes,
        },
        totalVotes,
        options: poll.options.map((option) => ({
          id: option.id,
          text: option.text,
          votes: option._count.votes,
          percentage:
            totalVotes > 0 ? (option._count.votes / totalVotes) * 100 : 0,
        })),
      };
    },

    myPolls: async (parent, args, context) => {
      const user = requireAuth(context.user);

      const polls = await prisma.poll.findMany({
        where: { userId: user.id },
        include: {
          options: {
            include: {
              _count: { select: { votes: true } },
            },
          },
          createdBy: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return polls.map((poll) => ({
        ...poll,
        createdAt: poll.createdAt.toISOString(),
        totalVotes: poll.options.reduce(
          (sum, option) => sum + option._count.votes,
          0
        ),
      }));
    },

    myVotes: async (parent, args, context) => {
      const user = requireAuth(context.user);

      return await prisma.vote.findMany({
        where: { userId: user.id },
        include: {
          option: {
            include: {
              poll: {
                include: {
                  createdBy: true,
                },
              },
            },
          },
          user: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },
  },

  Mutation: {
    register: async (parent, { input }) => {
      const { name, email, password } = input;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new GraphQLError("User already exists with this email");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const verificationCode = generateVerificationCode();

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          verificationCode,
          isVerified: false,
        },
      });

      const emailSent = await sendVerificationEmail(email, verificationCode);

      if (!emailSent) {
        console.warn("Failed to send verification email, but user was created");
      }

      return {
        success: true,
        message:
          "User registered successfully. Please check your email for verification code.",
      };
    },

    verifyEmail: async (parent, { input }) => {
      const { email, verificationCode } = input;

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        throw new GraphQLError("User not found");
      }

      if (user.isVerified) {
        throw new GraphQLError("Email is already verified");
      }

      if (user.verificationCode !== verificationCode) {
        throw new GraphQLError("Invalid verification code");
      }

      await prisma.user.update({
        where: { email },
        data: {
          isVerified: true,
          verificationCode: null,
        },
      });

      await sendWelcomeEmail(email, user.name);

      return {
        success: true,
        message: "Email verified successfully",
      };
    },

    resendVerification: async (parent, { input }) => {
      const { email } = input;

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        throw new GraphQLError("User not found");
      }

      if (user.isVerified) {
        throw new GraphQLError("Email is already verified");
      }

      const verificationCode = generateVerificationCode();

      await prisma.user.update({
        where: { email },
        data: { verificationCode },
      });

      const emailSent = await sendVerificationEmail(email, verificationCode);

      if (!emailSent) {
        throw new GraphQLError("Failed to send verification email");
      }

      return {
        success: true,
        message: "Verification code resent successfully",
      };
    },

    login: async (parent, { input }) => {
      const { email, password } = input;

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          _count: { select: { polls: true, votes: true } },
        },
      });

      if (!user) {
        throw new GraphQLError("Invalid credentials");
      }

      if (!user.isVerified) {
        throw new GraphQLError("Please verify your email before logging in");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new GraphQLError("Invalid credentials");
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return {
        success: true,
        message: "Login successful",
        token,
        user: {
          ...user,
          pollsCount: user._count.polls,
          votesCount: user._count.votes,
        },
      };
    },

    logout: () => {
      return "Logout successful. Please remove the token from client storage.";
    },

    createPoll: async (parent, { input }, context) => {
      const user = requireAuth(context.user);
      const { question, options } = input;

      if (options.length < 2) {
        throw new GraphQLError("At least 2 options are required");
      }

      const poll = await prisma.poll.create({
        data: {
          question,
          userId: user.id,
          options: {
            create: options.map((option) => ({ text: option })),
          },
        },
        include: {
          options: {
            include: {
              _count: { select: { votes: true } },
            },
          },
          createdBy: true,
        },
      });

      return {
        ...poll,
        totalVotes: 0,
      };
    },

    vote: async (parent, { pollId, optionId }, context) => {
      const user = requireAuth(context.user);

      const pollIdInt = parseInt(pollId);
      const optionIdInt = parseInt(optionId);

      const poll = await prisma.poll.findUnique({
        where: { id: pollIdInt },
        include: { options: true },
      });

      if (!poll) {
        throw new GraphQLError("Poll not found");
      }

      const option = poll.options.find((opt) => opt.id === optionIdInt);
      if (!option) {
        throw new GraphQLError("Option not found in this poll");
      }

      const existingVote = await prisma.vote.findFirst({
        where: {
          userId: user.id,
          option: { pollId: pollIdInt },
        },
      });

      if (existingVote) {
        throw new GraphQLError("You have already voted on this poll");
      }

      const vote = await prisma.vote.create({
        data: {
          userId: user.id,
          optionId: optionIdInt,
        },
        include: {
          option: {
            include: {
              poll: {
                include: { createdBy: true },
              },
            },
          },
          user: true,
        },
      });

      return vote;
    },

    deletePoll: async (parent, { id }, context) => {
      const user = requireAuth(context.user);
      const pollId = parseInt(id);

      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        select: { id: true, userId: true },
      });

      if (!poll) {
        throw new GraphQLError("Poll not found");
      }

      if (poll.userId !== user.id) {
        throw new GraphQLError("You can only delete your own polls");
      }

      await prisma.poll.delete({ where: { id: pollId } });

      return "Poll deleted successfully";
    },
  },

  Poll: {
    totalVotes: async (parent) => {
      if (parent.totalVotes !== undefined) return parent.totalVotes;

      const options = await prisma.option.findMany({
        where: { pollId: parent.id },
        include: { _count: { select: { votes: true } } },
      });

      return options.reduce((sum, option) => sum + option._count.votes, 0);
    },

    userVote: async (parent, args, context) => {
      if (!context.user) return null;
      if (parent.userVote !== undefined) return parent.userVote;

      // Find the user's vote for this poll
      const vote = await prisma.vote.findFirst({
        where: {
          userId: context.user.id,
          option: {
            pollId: parent.id,
          },
        },
        include: {
          option: true,
        },
      });

      if (!vote) return null;

      return {
        ...vote,
        createdAt: vote.createdAt.toISOString(),
      };
    },
  },

  Option: {
    votesCount: async (parent) => {
      if (parent._count?.votes !== undefined) return parent._count.votes;

      return await prisma.vote.count({ where: { optionId: parent.id } });
    },

    percentage: async (parent) => {
      // Get the poll ID - either from parent.pollId or by finding the poll that contains this option
      const pollId =
        parent.pollId ||
        (
          await prisma.option.findUnique({
            where: { id: parent.id },
            select: { pollId: true },
          })
        )?.pollId;

      if (!pollId) return 0;

      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: {
          options: {
            include: { _count: { select: { votes: true } } },
          },
        },
      });

      if (!poll) return 0;

      const totalVotes = poll.options.reduce(
        (sum, option) => sum + option._count.votes,
        0
      );

      const optionVotes =
        parent._count?.votes ||
        (await prisma.vote.count({ where: { optionId: parent.id } }));

      return totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
    },
  },

  User: {
    pollsCount: (parent) => parent.pollsCount || parent._count?.polls || 0,
    votesCount: (parent) => parent.votesCount || parent._count?.votes || 0,
  },
};

module.exports = resolvers;
