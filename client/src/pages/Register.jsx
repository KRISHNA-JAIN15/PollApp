"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  UserPlus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// Move FormField component outside to prevent re-creation on every render
const FormField = ({
  label,
  name,
  type,
  placeholder,
  icon: Icon,
  showToggle,
  onToggleShow,
  showValue,
  value,
  onChange,
  onBlur,
  status,
  error,
  touched,
}) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-gray-900"
      >
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon
            className={`h-5 w-5 transition-colors ${
              status === "error"
                ? "text-red-400"
                : status === "success"
                ? "text-green-500"
                : "text-gray-400"
            }`}
          />
        </div>
        <input
          id={name}
          name={name}
          type={type}
          autoComplete={name === "confirmPassword" ? "new-password" : name}
          required
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`block w-full pl-12 pr-12 py-3.5 text-gray-900 placeholder-gray-500 border-0 rounded-xl shadow-sm ring-1 ring-inset transition-all duration-200 focus:ring-2 focus:ring-inset sm:text-sm ${
            status === "error"
              ? "ring-red-300 focus:ring-red-500 bg-red-50"
              : status === "success"
              ? "ring-green-300 focus:ring-blue-500 bg-green-50"
              : "ring-gray-300 focus:ring-blue-500 bg-white hover:ring-gray-400"
          }`}
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          {showToggle && (
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={onToggleShow}
            >
              {showValue ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
          {status === "success" && !showToggle && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          {status === "error" && (
            <AlertCircle className="h-5 w-5 text-red-400" />
          )}
        </div>
      </div>
      {error && touched && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 2)
          return "Name must be at least 2 characters";
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Please enter a valid email address";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value))
          return "Password must contain uppercase, lowercase, and number";
        return "";
      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords do not match";
        return "";
      default:
        return "";
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error and revalidate if field was touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!validateForm()) {
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      navigate("/verify-email", { state: { email: formData.email } });
    }
  };

  const getFieldStatus = (fieldName) => {
    if (!touched[fieldName]) return "default";
    if (errors[fieldName]) return "error";
    if (formData[fieldName]) return "success";
    return "default";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg mb-6">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create your account
          </h1>
          <p className="text-gray-600">
            Join thousands of users already using our platform
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <FormField
              label="Full Name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              icon={User}
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              status={getFieldStatus("name")}
              error={errors.name}
              touched={touched.name}
            />

            <FormField
              label="Email Address"
              name="email"
              type="email"
              placeholder="Enter your email address"
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              status={getFieldStatus("email")}
              error={errors.email}
              touched={touched.email}
            />

            <FormField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              icon={Lock}
              showToggle={true}
              onToggleShow={() => setShowPassword(!showPassword)}
              showValue={showPassword}
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              status={getFieldStatus("password")}
              error={errors.password}
              touched={touched.password}
            />

            <FormField
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              icon={Lock}
              showToggle={true}
              onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
              showValue={showConfirmPassword}
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              status={getFieldStatus("confirmPassword")}
              error={errors.confirmPassword}
              touched={touched.confirmPassword}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Creating your account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
