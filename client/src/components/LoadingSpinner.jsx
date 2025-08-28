import React from "react";
import { HashLoader } from "react-spinners";

const LoadingSpinner = ({
  loading = true,
  size = 50,
  color = "#3B82F6",
  message = "Loading...",
}) => {
  if (!loading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="flex flex-col items-center space-y-4">
        <HashLoader
          color={color}
          loading={loading}
          size={size}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
        <p className="text-gray-600 text-lg font-medium">{message}</p>
        <p className="text-gray-400 text-sm">Server is starting up...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
