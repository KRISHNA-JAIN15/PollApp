import { useState } from "react";
import { Link } from "react-router-dom";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useMutation } from "@apollo/client/react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Plus,
  Users,
  Calendar,
  TrendingUp,
  MessageCircle,
  ChevronRight,
  Search,
  Filter,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";

const GET_POLLS = gql`
  query GetPolls {
    polls {
      id
      question
      description
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
      userVote {
        id
        option {
          id
        }
      }
    }
  }
`;

const VOTE_POLL = gql`
  mutation Vote($pollId: ID!, $optionId: ID!) {
    vote(pollId: $pollId, optionId: $optionId) {
      id
      option {
        id
        text
      }
    }
  }
`;

const PollCard = ({ poll, onVote }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);

  const totalVotes = poll.totalVotes || 0;
  const hasUserVoted = poll.userVote !== null;
  const userVotedOptionId = poll.userVote?.option?.id;
  const [showResults, setShowResults] = useState(hasUserVoted);

  const handleVote = async (optionId) => {
    if (isVoting || hasUserVoted) return;

    setIsVoting(true);
    try {
      await onVote(poll.id, optionId);
      setShowResults(true);
    } catch (error) {
      // Error handled in parent component
    } finally {
      setIsVoting(false);
    }
  };

  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-200">
      {/* Poll Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {poll.question}
        </h3>
        {poll.description && (
          <p className="text-gray-600 text-sm mb-3">{poll.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>By {poll.createdBy?.name || "Anonymous"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            <span>{totalVotes} votes</span>
          </div>
        </div>
      </div>

      {/* Poll Options */}
      <div className="space-y-3">
        {poll.options?.map((option) => {
          const votes = option.votesCount || 0;
          const percentage = option.percentage || 0;
          const isSelected = selectedOption === option.id;
          const isUserVoted = userVotedOptionId === option.id;

          return (
            <div key={option.id} className="relative">
              {showResults ? (
                // Results View
                <div className="relative">
                  <div
                    className={`absolute inset-0 rounded-lg transition-all duration-500 ${
                      isUserVoted
                        ? "bg-gradient-to-r from-green-100 to-blue-100"
                        : "bg-gradient-to-r from-blue-100 to-purple-100"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                  <div
                    className={`relative flex items-center justify-between p-3 rounded-lg border ${
                      isUserVoted
                        ? "border-green-300 bg-green-50/30"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {option.text}
                      </span>
                      {isUserVoted && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                          Your vote
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {percentage}%
                      </span>
                      <div className="text-xs text-gray-500">{votes} votes</div>
                    </div>
                  </div>
                </div>
              ) : (
                // Voting View
                <button
                  onClick={() => handleVote(option.id)}
                  disabled={isVoting || hasUserVoted}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="text-sm font-medium text-gray-900">
                    {option.text}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Toggle Results Button */}
      {(totalVotes > 0 || hasUserVoted) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowResults(!showResults)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <TrendingUp className="h-4 w-4" />
            {showResults ? "Hide Results" : "Show Results"}
          </button>
        </div>
      )}

      {isVoting && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <span className="ml-2 text-sm text-gray-600">Submitting vote...</span>
        </div>
      )}
    </div>
  );
};

const Polls = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const { user } = useAuth();

  // Use GraphQL query to fetch polls
  const { data, loading, error, refetch } = useQuery(GET_POLLS);

  // Use GraphQL mutation for voting
  const [votePoll] = useMutation(VOTE_POLL, {
    refetchQueries: [{ query: GET_POLLS }],
    onCompleted: () => {
      toast.success("Vote submitted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit vote");
    },
  });

  const handleVote = async (pollId, optionId) => {
    try {
      await votePoll({
        variables: { pollId, optionId },
      });
    } catch (error) {
      console.error("Error voting:", error);
      throw error;
    }
  };

  // Handle loading and error states
  if (loading) {
    return <LoadingSpinner message="Loading polls..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Error loading polls: {error.message}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const polls = data?.polls || [];

  const filteredAndSortedPolls = polls
    .filter((poll) =>
      poll.question.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "mostVotes":
          return (b.totalVotes || 0) - (a.totalVotes || 0);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Navbar />
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Community Polls
              </h1>
              <p className="text-gray-600 mt-1">
                Discover and vote on polls from the community
              </p>
            </div>
            <Link
              to="/create-poll"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Create Poll
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search polls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-0 rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 border-0 rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="mostVotes">Most Votes</option>
            </select>
          </div>
        </div>

        {/* Polls Grid */}
        {filteredAndSortedPolls.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? "No polls found" : "No polls yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Be the first to create a poll and start the conversation!"}
            </p>
            {!searchTerm && (
              <Link
                to="/create-poll"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Create Your First Poll
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAndSortedPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} onVote={handleVote} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Polls;
