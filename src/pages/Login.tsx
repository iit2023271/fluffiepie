import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, XCircle } from "lucide-react";


const fadeUp = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export default function Login() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const isStrongPassword = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      if (!fullName.trim() || fullName.trim().length < 2) { toast.error("Please enter a valid full name"); return; }
      if (!isStrongPassword) { toast.error("Please meet all password requirements"); return; }
    }
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success("Account created! Check your email to verify.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (error: any) { toast.error(error.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 25, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div key={isSignup ? "signup" : "signin"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">{isSignup ? "Create Account" : "Welcome Back"}</h1>
            <p className="text-muted-foreground">{isSignup ? "Join FluffiePie for delicious deliveries" : "Sign in to your FluffiePie account"}</p>
          </motion.div>
        </AnimatePresence>

        <motion.form onSubmit={handleSubmit} variants={stagger} initial="hidden" animate="show" className="space-y-4 p-8 rounded-2xl bg-card shadow-card">
          <AnimatePresence>
            {isSignup && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="relative overflow-hidden">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required={isSignup}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={fadeUp} className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 active:scale-90 transition-transform">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {isSignup && password.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-1 text-xs overflow-hidden">
                {[
                  { key: "length" as const, label: "At least 8 characters" },
                  { key: "uppercase" as const, label: "One uppercase letter" },
                  { key: "lowercase" as const, label: "One lowercase letter" },
                  { key: "number" as const, label: "One number" },
                  { key: "special" as const, label: "One special character" },
                ].map(({ key, label }, i) => (
                  <motion.div key={key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-1.5 transition-colors ${passwordChecks[key] ? "text-green-600" : "text-muted-foreground"}`}>
                    {passwordChecks[key] ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {label}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!isSignup && (
            <motion.div variants={fadeUp} className="text-right">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
            </motion.div>
          )}

          <motion.button variants={fadeUp} type="submit" disabled={loading} whileTap={loading ? {} : { scale: 0.97 }} whileHover={loading ? {} : { scale: 1.01 }}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-card hover:shadow-elevated">
            {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
          </motion.button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">or</span></div>
          </div>

          <motion.button variants={fadeUp} type="button" disabled={loading} whileTap={{ scale: 0.97 }}
            onClick={async () => { setLoading(true); const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); if (error) { toast.error("Google sign-in failed"); setLoading(false); } }}
            className="w-full py-3 flex items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-medium hover:bg-secondary active:bg-secondary transition-colors disabled:opacity-50">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>

          <motion.p variants={fadeUp} className="text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-primary font-medium hover:underline">
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </motion.p>
        </motion.form>
      </motion.div>
    </div>
  );
}