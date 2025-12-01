import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const auth = getAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(""); // Email or Username State
  const [password, setPassword] = useState(""); // Set Password State
  const [loading, setLoading] = useState(false); // Logging In Loading State
  const [resetLoading, setResetLoading] = useState(false); // Reset Link Sending Loading State


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let emailToUse = identifier;

      if (!identifier.includes("@")) {
        const q = query(collection(db, "users"), where("username", "==", identifier));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          toast.error("Username not found");
          setLoading(false);
          return;
        }

        emailToUse = snapshot.docs[0].data().email;
      }

      await signInWithEmailAndPassword(auth, emailToUse, password);
      toast.success("Logged in successfully!");
      setIdentifier("");
      setPassword("");
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Invalid email/username or password");
    } finally {
      setLoading(false);
    }
  };
    // Forgot Password Component Start
  const handleForgotPassword = async () => {
    if (!identifier) {
      toast.error("Please enter your email or username first");
      return;
    }

    setResetLoading(true);

    try {
      let emailToUse = identifier;

      // ---------- If username entered ----------
      if (!identifier.includes("@")) {
        const q = query(
          collection(db, "users"),
          where("username", "==", identifier)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          toast.error("Username not found");
          setResetLoading(false);
          return;
        }

        emailToUse = snapshot.docs[0].data().email;
      }

      // ---------- If user entered email directly ----------
      if (identifier.includes("@")) {
        const q = query(
          collection(db, "users"),
          where("email", "==", identifier)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          toast.error("No account found with this email");
          setResetLoading(false);
          return;
        }
      }

      // ---------- Send reset email ----------
      await sendPasswordResetEmail(auth, emailToUse);
      toast.success("Password reset link sent to your email!");
    } catch (error) {
      toast.error("Too many reset requests. Try again later.");
    }

    setResetLoading(false);
  };

    // Forgot Password Component End

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email or Username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
              placeholder="Enter email or username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="flex justify-between mt-4 text-sm">
          <span
            onClick={resetLoading ? null : handleForgotPassword}
            className="text-red-600 font-semibold cursor-pointer"
          >
            {resetLoading ? "Reset Link Sending..." : "Forgot Password?"}
          </span>

          <p className="text-sm text-center ">
              Don't have an account?{" "}
            <span
              onClick={() => navigate("/admin-signup")}
              className="text-green-600 font-semibold cursor-pointer"
            >
              Signup
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
