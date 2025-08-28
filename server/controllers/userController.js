const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class UserController {
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              polls: true,
              votes: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getStats(req, res) {
    try {
      const userId = req.user.id;

      // Get user's polls count
      const pollsCount = await prisma.poll.count({
        where: { userId }
      });

      // Get user's votes count
      const votesCount = await prisma.vote.count({
        where: { userId }
      });

      // Get total votes received on user's polls
      const totalVotesReceived = await prisma.vote.count({
        where: {
          option: {
            poll: {
              userId
            }
          }
        }
      });

      // Get user's most popular poll
      const pollsWithVotes = await prisma.poll.findMany({
        where: { userId },
        include: {
          options: {
            include: {
              _count: {
                select: { votes: true }
              }
            }
          }
        }
      });

      const pollsWithTotalVotes = pollsWithVotes.map(poll => ({
        ...poll,
        totalVotes: poll.options.reduce((sum, option) => sum + option._count.votes, 0)
      }));

      const mostPopularPoll = pollsWithTotalVotes.reduce((prev, current) => 
        (prev.totalVotes > current.totalVotes) ? prev : current
      , { totalVotes: 0 });

      res.json({
        stats: {
          pollsCreated: pollsCount,
          votesCast: votesCount,
          totalVotesReceived,
          mostPopularPoll: mostPopularPoll.totalVotes > 0 ? {
            id: mostPopularPoll.id,
            question: mostPopularPoll.question,
            totalVotes: mostPopularPoll.totalVotes
          } : null
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              polls: true,
              votes: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({ users });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UserController;
