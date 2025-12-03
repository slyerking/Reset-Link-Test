import { useState } from "react";

export default function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/sendResetEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleReset} className="p-4">
      <h2 className="text-lg mb-3 font-semibold">Reset Password</h2>

      <input
        type="email"
        className="border p-2 w-full mb-3"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Sending..." : "Send Reset Email"}
      </button>

      {message && <p className="mt-3">{message}</p>}
    </form>
  );
}
