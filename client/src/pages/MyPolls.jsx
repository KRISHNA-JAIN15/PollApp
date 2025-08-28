import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useMutation } from "@apollo/client/react";
import Navbar from "../components/Navbar";
import { Trash2, BarChart3, Users, Calendar, Edit3 } from "lucide-react";

const GET_MY_POLLS = gql`
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

const DELETE_POLL = gql`
  mutation DeletePoll($id: ID!) {
    deletePoll(id: $id)
  }
`;

const MyPolls = () => {
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const navigate = useNavigate();

  // Use GraphQL query to fetch user's polls
  const { data, loading, error, refetch } = useQuery(GET_MY_POLLS);

  // Use GraphQL mutation for deleting polls
  const [deletePollMutation] = useMutation(DELETE_POLL, {
    refetchQueries: [{ query: GET_MY_POLLS }],
    onCompleted: () => {
      // Poll deleted successfully
    },
    onError: (error) => {
      console.error("Error deleting poll:", error);
    },
  });

  const deletePoll = async (pollId) => {
    if (!window.confirm("Are you sure you want to delete this poll?")) {
      return;
    }

    try {
      await deletePollMutation({
        variables: { id: pollId },
      });
    } catch (error) {
      console.error("Error deleting poll:", error);
    }
  };

  const viewPollStats = (poll) => {
    setSelectedPoll(poll);
    setShowStats(true);
  };

  const getTotalVotes = (poll) => {
    return poll.totalVotes || 0;
  };

  const getTopOption = (poll) => {
    if (!poll.options || poll.options.length === 0) return null;

    return poll.options.reduce((top, current) => {
      const currentVotes = current.votesCount || 0;
      const topVotes = top.votesCount || 0;
      return currentVotes > topVotes ? current : top;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
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
      </div>
    );
  }

  const myPolls = data?.myPolls || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Navbar />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Polls</h1>
            <p className="text-gray-600">
              Manage and view statistics for your created polls
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Polls
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {myPolls.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Votes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {myPolls.reduce(
                      (total, poll) => total + getTotalVotes(poll),
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      myPolls.filter(
                        (poll) =>
                          new Date(poll.createdAt) >
                          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Polls List */}
          {myPolls.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No polls yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first poll to get started!
              </p>
              <button
                onClick={() => navigate("/create-poll")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create Poll
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {myPolls.map((poll) => {
                const totalVotes = getTotalVotes(poll);
                const topOption = getTopOption(poll);

                return (
                  <div
                    key={poll.id}
                    className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {poll.question}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(poll.createdAt)}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {totalVotes} votes
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewPollStats(poll)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Statistics"
                        >
                          <BarChart3 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deletePoll(poll.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Poll"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">
                          Most Popular Option
                        </p>
                        <p className="font-semibold text-gray-900">
                          {topOption ? topOption.text : "No votes yet"}
                        </p>
                        {topOption && (
                          <p className="text-sm text-blue-600">
                            {topOption.votesCount || 0} votes
                          </p>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">Options</p>
                        <p className="font-semibold text-gray-900">
                          {poll.options?.length || 0} choices
                        </p>
                      </div>
                    </div>

                    {/* Options Preview */}
                    <div className="space-y-2">
                      {poll.options?.slice(0, 3).map((option, index) => {
                        const voteCount = option.votesCount || 0;
                        const percentage =
                          totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                        return (
                          <div
                            key={option.id}
                            className="bg-gray-50 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {option.text}
                              </span>
                              <span className="text-sm text-gray-600">
                                {voteCount} votes ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {poll.options?.length > 3 && (
                        <button
                          onClick={() => viewPollStats(poll)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View all {poll.options.length} options →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Poll Statistics Modal */}
      {showStats && selectedPoll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Poll Statistics
              </h2>
              <button
                onClick={() => setShowStats(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedPoll.question}
              </h3>
              <p className="text-gray-600">
                Created on {formatDate(selectedPoll.createdAt)}
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-blue-600">
                  {getTotalVotes(selectedPoll)}
                </p>
                <p className="text-gray-600">Total Votes</p>
              </div>

              {selectedPoll.options?.map((option) => {
                const voteCount = option.votesCount || 0;
                const totalVotes = getTotalVotes(selectedPoll);
                const percentage =
                  totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                return (
                  <div key={option.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">
                        {option.text}
                      </span>
                      <span className="text-gray-600">
                        {voteCount} votes ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MyPolls;
