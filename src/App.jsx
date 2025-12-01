import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import TakesellPricesCalculator from "./components/TakesellPricesCalculator";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import PasswordResetForm from "./components/PasswordResetForm";

function App() {
  return (
    <Router>
      <Routes>
        {/* Dashboard / Main Pricing Tool */}
        <Route path="/" element={<TakesellPricesCalculator />} />

        {/* Login Page */}
        <Route path="/admin-login" element={<LoginPage />} />

        {/* Signup Page */}
        <Route path="/admin-signup" element={<SignupPage />} />
                {/* Signup Page */}
        <Route path="/reset-link" element={<PasswordResetForm />} />
      </Routes>
    </Router>
  );
}

export default App;
