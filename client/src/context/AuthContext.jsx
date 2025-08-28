import React, { createContext, useContext, useReducer, useEffect } from "react";
import { authAPI } from "../utils/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  needsVerification: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        needsVerification: false,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        needsVerification: false,
      };
    case "REGISTER_SUCCESS":
      return {
        ...state,
        needsVerification: true,
        isLoading: false,
      };
    case "VERIFICATION_SUCCESS":
      return {
        ...state,
        needsVerification: false,
        isLoading: false,
      };
    case "NEEDS_VERIFICATION":
      return {
        ...state,
        needsVerification: true,
        isLoading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children, apolloClient }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user: parsedUser, token },
        });
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    dispatch({ type: "SET_LOADING", payload: false });
  }, []);

  const register = async (userData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.register(userData);

      if (response.data.success) {
        dispatch({ type: "REGISTER_SUCCESS" });
        toast.success(response.data.message);
        return { success: true, data: response.data };
      }
    } catch (error) {
      const message = error.response?.data?.error || "Registration failed";
      toast.error(message);
      dispatch({ type: "SET_LOADING", payload: false });
      return { success: false, error: message };
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.login(credentials);

      if (response.data.success) {
        const { user, token } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Clear Apollo Client cache to ensure fresh data for the new user
        if (apolloClient) {
          await apolloClient.clearStore();
        }

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });

        toast.success("Login successful!");
        return { success: true, data: response.data };
      }
    } catch (error) {
      const errorData = error.response?.data;

      if (errorData?.needsVerification) {
        dispatch({ type: "NEEDS_VERIFICATION" });
        toast.error("Please verify your email before logging in");
        return { success: false, needsVerification: true };
      }

      const message = errorData?.error || "Login failed";
      toast.error(message);
      dispatch({ type: "SET_LOADING", payload: false });
      return { success: false, error: message };
    }
  };

  const verifyEmail = async (email, verificationCode) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.verifyEmail({ email, verificationCode });

      if (response.data.success) {
        dispatch({ type: "VERIFICATION_SUCCESS" });
        toast.success(response.data.message);
        return { success: true, data: response.data };
      }
    } catch (error) {
      const message = error.response?.data?.message || "Verification failed";
      toast.error(message);
      dispatch({ type: "SET_LOADING", payload: false });
      return { success: false, error: message };
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await authAPI.resendVerification(email);

      if (response.data.success) {
        toast.success(response.data.message);
        return { success: true };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to resend verification";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Clear Apollo Client cache to prevent stale data
      if (apolloClient) {
        await apolloClient.clearStore();
      }
      
      dispatch({ type: "LOGOUT" });
      toast.success("Logged out successfully");
    }
  };

  const value = {
    ...state,
    register,
    login,
    verifyEmail,
    resendVerification,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
