import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/lib/api";
import { persistSession, SESSION_KEYS } from "@/lib/session";
import SimpleGoogleSignIn from "@/components/SimpleGoogleSignIn";

const UserLogin = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Password Mismatch",
            description: "Passwords do not match",
            variant: "destructive",
          });
          return;
        }

        const response = await api.auth.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "user",
        });

        persistSession(SESSION_KEYS.user, {
          token: response.token,
          user: response.user,
        });

        toast({
          title: "Account Created!",
          description: "Welcome to EventHub!",
        });
        navigate("/user-portal");
      } else {
        const response = await api.auth.login({
          email: formData.email,
          password: formData.password,
        });

        persistSession(SESSION_KEYS.user, {
          token: response.token,
          user: response.user,
        });

        toast({
          title: "Login Successful",
          description: "Welcome back to EventHub!",
        });
        navigate("/user-portal");
      }
    } catch (error) {
      console.error("Auth error:", error);
      if (error instanceof ApiError) {
        toast({
          title: isSignUp ? "Sign Up Failed" : "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Error",
          description: "Failed to connect to server. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    try {
      const data = await api.auth.google(credential, "user");

      persistSession(SESSION_KEYS.user, {
        token: data.token,
        user: data.user,
      });

      toast({
        title: "Google Sign-In Successful",
        description: `Welcome ${data.user.name}!`,
      });
      navigate("/user-portal");
    } catch (error) {
      console.error("Google auth error:", error);
      if (error instanceof ApiError) {
        toast({
          title: "Google Sign-In Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Error",
          description: "Failed to connect to server. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error: any) => {
    console.error('Google Sign-In error:', error);
    toast({
      title: "Google Sign-In Error",
      description: "Failed to sign in with Google. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">
            {isSignUp ? "User Sign Up" : "User Sign In"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait..." : (isSignUp ? "Sign Up" : "Sign In")}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <SimpleGoogleSignIn
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={loading}
              role="user"
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary hover:underline"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default UserLogin;
