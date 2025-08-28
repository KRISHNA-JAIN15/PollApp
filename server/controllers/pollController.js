const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

class PollController {
  static async createPoll(req, res) {
    try {
      const { question, description, options } = req.body;
      const userId = req.user.id;

      if (!question || !options || options.length < 2) {
        return res.status(400).json({
          success: false,
          error: "Question and at least 2 options are required",
        });
      }

      const poll = await prisma.poll.create({
        data: {
          question,
          userId,
          options: {
            create: options.map((option) => ({ text: option.text })),
          },
        },
        include: {
          options: {
            include: {
              _count: {
                select: { votes: true },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Poll created successfully",
        poll,
      });
    } catch (error) {
      console.error("Poll creation error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  static async getAllPolls(req, res) {
    try {
      const polls = await prisma.poll.findMany({
        include: {
          options: {
            include: {
              _count: {
                select: { votes: true },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { options: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const pollsWithStats = polls.map((poll) => ({
        ...poll,
        totalVotes: poll.options.reduce(
          (sum, option) => sum + option._count.votes,
          0
        ),
      }));

      res.json({ polls: pollsWithStats });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getPollById(req, res) {
    try {
      const pollId = parseInt(req.params.id);

      if (isNaN(pollId)) {
        return res.status(400).json({ error: "Invalid poll ID" });
      }

      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: {
          options: {
            include: {
              _count: {
                select: { votes: true },
              },
              votes: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }

      const totalVotes = poll.options.reduce(
        (sum, option) => sum + option._count.votes,
        0
      );

      res.json({
        poll: {
          ...poll,
          totalVotes,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async votePoll(req, res) {
    try {
      const pollId = parseInt(req.params.id);
      const { optionId } = req.body;
      const userId = req.user.id;

      if (isNaN(pollId)) {
        return res.status(400).json({ error: "Invalid poll ID" });
      }

      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: {
          options: true,
        },
      });

      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }

      const option = poll.options.find((opt) => opt.id === optionId);
      if (!option) {
        return res.status(400).json({ error: "Option not found in this poll" });
      }

      const existingVote = await prisma.vote.findFirst({
        where: {
          userId,
          option: {
            pollId,
          },
        },
      });

      if (existingVote) {
        return res
          .status(400)
          .json({ error: "You have already voted on this poll" });
      }

      const vote = await prisma.vote.create({
        data: {
          userId,
          optionId,
        },
        include: {
          option: {
            include: {
              poll: {
                select: {
                  id: true,
                  question: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.status(201).json({
        message: "Vote cast successfully",
        vote,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getPollResults(req, res) {
    try {
      const pollId = parseInt(req.params.id);

      if (isNaN(pollId)) {
        return res.status(400).json({ error: "Invalid poll ID" });
      }

      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: {
          options: {
            include: {
              _count: {
                select: { votes: true },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }

      const totalVotes = poll.options.reduce(
        (sum, option) => sum + option._count.votes,
        0
      );

      const results = {
        poll: {
          id: poll.id,
          question: poll.question,
          createdBy: poll.createdBy,
          createdAt: poll.createdAt,
        },
        totalVotes,
        options: poll.options.map((option) => ({
          id: option.id,
          text: option.text,
          votes: option._count.votes,
          percentage:
            totalVotes > 0
              ? ((option._count.votes / totalVotes) * 100).toFixed(2)
              : 0,
        })),
      };

      res.json({ results });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getUserPolls(req, res) {
    try {
      const userId = req.user.id;

      const polls = await prisma.poll.findMany({
        where: { userId },
        include: {
          options: {
            include: {
              _count: {
                select: { votes: true },
              },
            },
          },
          _count: {
            select: { options: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const pollsWithStats = polls.map((poll) => ({
        ...poll,
        totalVotes: poll.options.reduce(
          (sum, option) => sum + option._count.votes,
          0
        ),
      }));

      res.json({ polls: pollsWithStats });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getUserVotes(req, res) {
    try {
      const userId = req.user.id;

      const votes = await prisma.vote.findMany({
        where: { userId },
        include: {
          option: {
            include: {
              poll: {
                select: {
                  id: true,
                  question: true,
                  createdAt: true,
                  createdBy: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json({ votes });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async deletePoll(req, res) {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user.id;

      if (isNaN(pollId)) {
        return res.status(400).json({ error: "Invalid poll ID" });
      }

      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        select: { id: true, userId: true },
      });

      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }

      if (poll.userId !== userId) {
        return res
          .status(403)
          .json({ error: "You can only delete your own polls" });
      }

      await prisma.poll.delete({
        where: { id: pollId },
      });

      res.json({ message: "Poll deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = PollController;
