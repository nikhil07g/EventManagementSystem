import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import SimpleGoogleSignIn from "@/components/SimpleGoogleSignIn";
import { api, ApiError } from "@/lib/api";
import { persistSession, SESSION_KEYS } from "@/lib/session";

const OrganizerLogin = () => {
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
          role: "organizer",
        });

        if (response.user.role !== "organizer") {
          throw new ApiError("Account must be registered as an organizer.", 403);
        }

        persistSession(SESSION_KEYS.organizer, {
          token: response.token,
          user: response.user,
        });

        toast({
          title: "Account Created!",
          description: "Welcome to EventHub, organizer!",
        });
        navigate("/organizer-dashboard");
      } else {
        const response = await api.auth.login({
          email: formData.email,
          password: formData.password,
        });

        if (response.user.role !== "organizer") {
          toast({
            title: "Access Denied",
            description: "Only organizers can access this portal",
            variant: "destructive",
          });
          return;
        }

        persistSession(SESSION_KEYS.organizer, {
          token: response.token,
          user: response.user,
        });

        toast({
          title: "Login Successful",
          description: "Welcome back, organizer!",
        });
        navigate("/organizer-dashboard");
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
      const data = await api.auth.google(credential, "organizer");

      if (!data || !data.token || !data.user) {
        throw new Error("Invalid response from server. Missing authentication data.");
      }

      if (!data.user.role) {
        console.warn("User role missing, defaulting to 'organizer'");
        data.user.role = 'organizer';
      }

      if (data.user.role !== "organizer") {
        toast({
          title: "Access Denied",
          description: "Only organizers can access this portal",
          variant: "destructive",
        });
        return;
      }

      persistSession(SESSION_KEYS.organizer, {
        token: data.token,
        user: data.user,
      });

      toast({
        title: "Google Sign-In Successful",
        description: `Welcome ${data.user.name || 'Organizer'}!`,
      });
      navigate("/organizer-dashboard");
    } catch (error) {
      console.error("Google auth error:", error);
      if (error instanceof ApiError) {
        toast({
          title: "Google Sign-In Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (error instanceof Error) {
        toast({
          title: "Authentication Error",
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
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Link 
            to="/" 
            className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          
          <Card className="p-8 backdrop-blur-sm bg-white/10 border-white/20">
            <div className="flex items-center justify-center mb-8">
              <Calendar className="h-8 w-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white ml-3">EventHub</h1>
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Organizer Portal</h2>
              <p className="text-white/70">
                {isSignUp ? 'Create your organizer account' : 'Access your event management dashboard'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  required
                />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    required
                  />
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 disabled:opacity-50"
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In to Dashboard')}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-purple-900 px-2 text-white/70">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <SimpleGoogleSignIn
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  disabled={loading}
                  role="organizer"
                />
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-white/70 text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{" "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-white/70 text-sm">
                Need help?{" "}
                <Link to="/support" className="text-purple-400 hover:text-purple-300">
                  Contact Support
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
  );
};

export default OrganizerLogin;
