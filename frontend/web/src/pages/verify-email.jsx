import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiClient from "../services/apiClient";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [verificationMessage, setVerificationMessage] = useState(
    "Verifying your email, please wait..."
  );

  useEffect(() => {
    if (!token) {
      setVerificationStatus("error");
      setVerificationMessage(
        "No verification token provided. Please check the link in your email."
      );
      return;
    }

    const verifyEmail = async () => {
      try {
        console.log("Attempting to verify on frontend with token:", token);
        const response = await apiClient.get(`/auth/verify-email?token=${token}`);
        if (response.data.status === "success") {
          setVerificationStatus("success");
          setVerificationMessage(
            response.data.message ||
              "Email verified successfully. You can now log in."
          );
        } else {
          setVerificationStatus("error");
          setVerificationMessage(
            response.data.message || "An unknown error occurred."
          );
        }
      } catch (error) {
        setVerificationStatus("error");
        setVerificationMessage(
          error.response?.data?.message ||
            "Failed to verify email. The link might be expired or invalid."
        );
      }
    };

    verifyEmail();
  }, [token]);

  const success = verificationStatus === "success";
  const isLoading = verificationStatus === "verifying";

  return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-black">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-2xl shadow-slate-900/50 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div
            className={
              "w-7 h-7 rounded-full flex items-center justify-center text-sm " +
              (isLoading
                ? "bg-slate-500/20 text-slate-600 dark:text-slate-200"
                : success
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                : "bg-red-500/20 text-red-600 dark:text-red-300")
            }
          >
            {isLoading ? "…" : success ? "✓" : "!"}
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Email verification
          </h2>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          {verificationMessage}
        </p>

        <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400">
          <Link
            to="/login"
            className="text-indigo-500 hover:text-indigo-400 font-medium"
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}