import React, { useState } from "react";
import api from "../api";
import universalApi from "../api/universal";
import { useAppDispatch } from "../store/hooks";
import { setUser, clearUser } from "../store/userSlice";
import { useNavigate, Link } from "react-router-dom";
import { persistor } from "../store/store";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { PenTool, AlertCircle } from "lucide-react";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const login = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // Purge any stale persisted state from a previous user session
      dispatch(clearUser());
      await persistor.purge();

      const productId = import.meta.env.VITE_PRODUCT_ID as string | undefined;
      if (!productId) {
        setMessage("Missing product id configuration");
        return;
      }

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
      await persistor.flush(); // ensure new state is persisted immediately
      navigate("/dashboard");
    } catch (err: any) {
      // Extract the most descriptive error message from the response
      const data = err?.response?.data;
      let msg = "Login failed";
      if (data) {
        if (Array.isArray(data.details) && data.details.length > 0) {
          // express-validator errors
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

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="bg-indigo-100 p-3 rounded-full">
              <PenTool className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Sign in to ESign</CardTitle>
          <CardDescription className="text-slate-500">Welcome back! Please enter your details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              autoComplete="email" 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              autoComplete="current-password" 
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()} 
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
            onClick={login}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <div className="text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
              Register
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
