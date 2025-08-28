import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { Plus, X, PlusCircle, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const CREATE_POLL = gql`
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

const CreatePoll = () => {
  const [formData, setFormData] = useState({
    question: "",
    description: "",
    options: ["", ""],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use GraphQL mutation for creating poll
  const [createPoll] = useMutation(CREATE_POLL, {
    onCompleted: () => {
      toast.success("Poll created successfully!");
      navigate("/my-polls");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create poll");
      setErrors({ submit: error.message });
    },
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.question.trim()) {
      newErrors.question = "Poll question is required";
    }

    const validOptions = formData.options.filter((option) => option.trim());
    if (validOptions.length < 2) {
      newErrors.options = "At least 2 options are required";
    }

    if (validOptions.length !== new Set(validOptions).size) {
      newErrors.options = "Options must be unique";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));

    // Clear options error when user starts typing
    if (errors.options) {
      setErrors((prev) => ({
        ...prev,
        options: "",
      }));
    }
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData((prev) => ({
        ...prev,
        options: [...prev.options, ""],
      }));
    }
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        options: newOptions,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const pollData = {
        question: formData.question.trim(),
        options: formData.options
          .filter((option) => option.trim())
          .map((option) => option.trim()),
      };

      await createPoll({
        variables: { input: pollData },
      });
    } catch (error) {
      console.error("Error creating poll:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Navbar />
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 shadow-lg mb-6">
              <PlusCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create a New Poll
            </h1>
            <p className="text-gray-600">
              Ask a question and gather opinions from the community
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
            {errors.submit && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-600">{errors.submit}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Poll Question */}
              <div className="space-y-2">
                <label
                  htmlFor="question"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Poll Question *
                </label>
                <input
                  type="text"
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleChange}
                  placeholder="What would you like to ask?"
                  className={`block w-full px-4 py-3.5 text-gray-900 placeholder-gray-500 border-0 rounded-xl shadow-sm ring-1 ring-inset transition-all duration-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm ${
                    errors.question
                      ? "ring-red-300 bg-red-50"
                      : "ring-gray-300 bg-white hover:ring-gray-400"
                  }`}
                />
                {errors.question && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.question}</span>
                  </div>
                )}
              </div>

              {/* Poll Description */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add more details about your poll..."
                  className="block w-full px-4 py-3.5 text-gray-900 placeholder-gray-500 border-0 rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 transition-all duration-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white hover:ring-gray-400 sm:text-sm resize-none"
                />
              </div>

              {/* Poll Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-900">
                    Poll Options *
                  </label>
                  <span className="text-xs text-gray-500">
                    {formData.options.length}/10 options
                  </span>
                </div>

                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(index, e.target.value)
                        }
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 border-0 rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 transition-all duration-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white hover:ring-gray-400 sm:text-sm"
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {formData.options.length < 10 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </button>
                )}

                {errors.options && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.options}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-3.5 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Creating Poll...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Create Poll
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Tips */}
          <div className="mt-6 bg-blue-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Tips for a great poll:
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Keep your question clear and concise</li>
              <li>• Provide balanced and distinct options</li>
              <li>• Consider adding a description for complex topics</li>
              <li>
                • Make sure your options cover all reasonable possibilities
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePoll;
