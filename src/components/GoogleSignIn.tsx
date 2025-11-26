import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface GoogleSignInProps {
  onSuccess: (credential: string) => void;
  onError: (error: any) => void;
  disabled?: boolean;
  role?: 'user' | 'organizer';
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleSignIn = ({ onSuccess, onError, disabled = false, role = 'user' }: GoogleSignInProps) => {
  const { toast } = useToast();

  const handleCredentialResponse = useCallback((response: any) => {
    console.log('Google credential response:', response);
    if (response.credential) {
      onSuccess(response.credential);
    } else {
      onError('No credential received');
    }
  }, [onSuccess, onError]);

  useEffect(() => {
    // Check if script is already loaded
    if (window.google) {
      initializeGoogle();
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google script loaded');
      initializeGoogle();
    };

    script.onerror = () => {
      console.error('Failed to load Google script');
      toast({
        title: 'Google Sign-In Error',
        description: 'Failed to load Google authentication. Please refresh and try again.',
        variant: 'destructive',
      });
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      try {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      } catch (error) {
        console.log('Script cleanup error:', error);
      }
    };
  }, []);

  const initializeGoogle = () => {
    if (window.google && window.google.accounts) {
      try {
        console.log('Initializing Google OAuth...');
        window.google.accounts.id.initialize({
          client_id: '330432503289-e4ufv921aq1jdh7lponqfi1jo8o5bs5u.apps.googleusercontent.com',
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false, // Disable FedCM for better compatibility
        });
        console.log('Google OAuth initialized successfully');
      } catch (error) {
        console.error('Google initialization error:', error);
        toast({
          title: 'Google Sign-In Error',
          description: 'Failed to initialize Google authentication.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleGoogleSignIn = () => {
    if (!window.google || !window.google.accounts) {
      toast({
        title: 'Google Sign-In Unavailable',
        description: 'Google authentication is still loading. Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Initiating Google Sign-In...');
      // Use popup method instead of prompt for better reliability
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-temp-button'),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        }
      );
      
      // Trigger click on the rendered button
      setTimeout(() => {
        const button = document.getElementById('google-signin-temp-button')?.querySelector('div[role="button"]') as HTMLElement;
        if (button) {
          console.log('Clicking Google button...');
          button.click();
        } else {
          // Fallback to prompt method
          console.log('Fallback to prompt method...');
          window.google.accounts.id.prompt((notification: any) => {
            console.log('Google prompt notification:', notification);
            if (notification.isNotDisplayed()) {
              toast({
                title: 'Google Sign-In',
                description: 'Please allow popups for Google Sign-In to work.',
                variant: 'destructive',
              });
            }
          });
        }
      }, 100);
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: 'Google Sign-In Error',
        description: 'Failed to initiate Google sign-in. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300 flex items-center justify-center gap-2"
        onClick={handleGoogleSignIn}
        disabled={disabled}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>
      <div id="google-signin-temp-button" className="hidden"></div>
    </>
  );
};

export default GoogleSignIn;