import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect any old reset links to the OTP-based flow
    navigate("/forgot-password", { replace: true });
  }, [navigate]);

  return null;
}