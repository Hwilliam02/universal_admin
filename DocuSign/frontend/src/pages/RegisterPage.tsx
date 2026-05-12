import React, { useState } from "react";
import api from "../api";
import universalApi from "../api/universal";
import { useAppDispatch } from "../store/hooks";
import { setUser, clearUser } from "../store/userSlice";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { persistor } from "../store/store";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { PenTool, AlertCircle, CheckCircle2, Mail, ArrowLeft } from "lucide-react";

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Verification state
  const [verificationStep, setVerificationStep] = useState<'register' | 'code' | 'link'>('register');
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const register = async () => {
    setLoading(true);
    setMessage(null);
    setSuccessMessage(null);
    try {
      // Purge any stale persisted state from a previous user session
      dispatch(clearUser());
      await persistor.purge();

      const productId = import.meta.env.VITE_PRODUCT_ID as string | undefined;
      if (!productId) {
        setMessage("Missing product id configuration");
        return;
      }

      const signupRes = await universalApi.post("/universal-auth/signup", {
        username,
        email,
        password,
        global_company_id: companyId || null,
        product_id: productId
      });

      const data = signupRes.data;

      // Check if verification is required
      if (data.status === 'verification_required') {
        setVerificationEmail(data.email);
        
        if (data.method === 'code') {
          setVerificationStep('code');
          return;
        } else if (data.method === 'link') {
          setVerificationStep('link');
          return;
        }
      }

      // No verification needed — auto-login (existing flow)
      const resp = await universalApi.post("/universal-auth/login", {
        email,
        password,
        product_id: productId
      });

      const appToken = resp.data.appAccessToken as string | undefined;
      if (!appToken) {
        setMessage("Unable to obtain product access token");
        return;
      }

      const me = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${appToken}` }
      });

      dispatch(setUser({ user: me.data, accessToken: appToken }));
      await persistor.flush();
      navigate("/dashboard");
    } catch (err: any) {
      // Extract the most descriptive error message from the response
      const data = err?.response?.data;
      let msg = "Registration failed";
      if (data) {
        if (Array.isArray(data.details) && data.details.length > 0) {
          msg = data.details.map((d: any) => d.msg).join("; ");
        } else if (data.error) {
          msg = data.error;
        } else if (data.message) {
          msg = data.message;
        }
      } else if (err?.message) {
        msg = err.message;
      }
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setVerifyLoading(true);
    setMessage(null);
    setSuccessMessage(null);
    try {
      const res = await universalApi.post("/universal-auth/verify-user", {
        email: verificationEmail,
        verification_code: verificationCode,
      });

      if (res.data.status === 'success') {
        setSuccessMessage("Email verified! Logging you in...");

        // Auto-login after verification
        const productId = import.meta.env.VITE_PRODUCT_ID as string;
        const resp = await universalApi.post("/universal-auth/login", {
          email: verificationEmail,
          password,
          product_id: productId
        });

        const appToken = resp.data.appAccessToken as string | undefined;
        if (!appToken) {
          setSuccessMessage(null);
          setMessage("Verified but unable to obtain access token. Please log in manually.");
          return;
        }

        const me = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${appToken}` }
        });

        dispatch(setUser({ user: me.data, accessToken: appToken }));
        await persistor.flush();
        navigate("/dashboard");
      }
    } catch (err: any) {
      const data = err?.response?.data;
      setMessage(data?.error || data?.message || "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setMessage(null);
    try {
      const res = await universalApi.post("/universal-auth/resend-verification", {
        email: verificationEmail,
      });

      if (res.data.status === 'success') {
        // If method changed (unlikely but possible), update the step
        if (res.data.method === 'link') {
          setVerificationStep('link');
        } else {
          setVerificationStep('code');
        }
        setSuccessMessage(res.data.message || "Verification resent!");
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      const data = err?.response?.data;
      setMessage(data?.error || "Failed to resend verification");
    } finally {
      setResendLoading(false);
    }
  };

  // ──────────── CODE VERIFICATION SCREEN ────────────
  if (verificationStep === 'code') {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md shadow-lg border-slate-200">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="bg-indigo-100 p-3 rounded-full">
                <Mail className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-slate-500">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-indigo-600">{verificationEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && verificationCode.length === 6 && handleVerifyCode()}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                maxLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleVerifyCode}
              disabled={verifyLoading || verificationCode.length !== 6}
            >
              {verifyLoading ? "Verifying..." : "Verify Email"}
            </Button>
            <div className="flex items-center justify-between w-full text-sm">
              <button
                onClick={() => { setVerificationStep('register'); setMessage(null); setSuccessMessage(null); }}
                className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend Code"}
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ──────────── LINK VERIFICATION SCREEN ────────────
  if (verificationStep === 'link') {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md shadow-lg border-slate-200">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="bg-green-100 p-3 rounded-full">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-slate-500">
              We sent a verification link to{" "}
              <span className="font-semibold text-indigo-600">{verificationEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            <div className="bg-slate-50 rounded-lg p-6 text-center space-y-3">
              <Mail className="h-12 w-12 text-indigo-400 mx-auto" />
              <p className="text-sm text-slate-600">
                Click the verification link in your email to activate your account.
                After verifying, you can{" "}
                <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                  log in here
                </Link>
                .
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendVerification}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending..." : "Resend Verification Email"}
            </Button>
            <div className="flex items-center justify-between w-full text-sm">
              <button
                onClick={() => { setVerificationStep('register'); setMessage(null); setSuccessMessage(null); }}
                className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Register
              </button>
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              >
                Go to Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ──────────── REGISTER FORM (default) ────────────
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="bg-indigo-100 p-3 rounded-full">
              <PenTool className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription className="text-slate-500">Start signing documents today.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              placeholder="Harry" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && register()} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyId">Company ID (optional)</Label>
            <Input 
              id="companyId" 
              placeholder="C-12345" 
              value={companyId} 
              onChange={(e) => setCompanyId(e.target.value)} 
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
            onClick={register}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
          <div className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
