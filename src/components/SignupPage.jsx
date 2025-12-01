import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const auth = getAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // --- Check Username ---
      const usernameQuery = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      const usernameSnapshot = await getDocs(usernameQuery);
      if (!usernameSnapshot.empty) {
        toast.error("Username already exists!");
        setLoading(false);
        return;
      }

      // --- Check Email ---
      const emailQuery = query(collection(db, "users"), where("email", "==", email));
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        toast.error("Email already exists!");
        setLoading(false);
        return;
      }

      // --- Create Auth User ---
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // --- Save additional info to Firestore ---
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        fullName,
        username,
        email,
        createdAt: new Date(),
      });

      toast.success("Signup successful!");
      setFullName("");
      setUsername("");
      setEmail("");
      setPassword("");

      // Redirect to login page or dashboard
      navigate("/admin-login");
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Signup</h2>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
              placeholder="Enter your email"
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
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
          >
            {loading ? "Signing up..." : "Signup"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/admin-login")}
            className="text-blue-600 font-semibold cursor-pointer"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
