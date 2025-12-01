import { useState } from "react";

export default function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Sending...");

    try {
      const res = await fetch("/api/sendResetEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.success) setMessage("Password reset email sent successfully!");
      else setMessage("Error: " + data.error);
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong!");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Password Reset</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />
      <button
        type="submit"
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Send Reset Email
      </button>
      <p style={{ marginTop: "10px", color: "#333" }}>{message}</p>
    </form>
  );
}
