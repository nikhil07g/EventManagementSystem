import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SimpleGoogleSignInProps {
  onSuccess: (credential: string) => void;
  onError: (error: any) => void;
  disabled?: boolean;
  role?: 'user' | 'organizer';
}

declare global {
  interface Window {
    google: any;
    handleGoogleCallback: (response: any) => void;
  }
}

const SimpleGoogleSignIn = ({ onSuccess, onError, disabled = false }: SimpleGoogleSignInProps) => {
  const { toast } = useToast();
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set up global callback
    window.handleGoogleCallback = (response: any) => {
      console.log('Google callback received:', response);
      if (response.credential) {
        onSuccess(response.credential);
      } else {
        onError('No credential received');
      }
    };

    // Load Google script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      script.onerror = () => {
        console.error('Failed to load Google script');
        toast({
          title: 'Google Sign-In Error',
          description: 'Failed to load Google services. Please check your internet connection.',
          variant: 'destructive',
        });
      };
      document.head.appendChild(script);
    } else {
      initializeGoogle();
    }

    return () => {
      // Cleanup
      if (window.handleGoogleCallback) {
        delete window.handleGoogleCallback;
      }
    };
  }, [onSuccess, onError, toast]);

  const initializeGoogle = () => {
    if (window.google && buttonRef.current) {
      try {
        console.log('Rendering Google button...');
        window.google.accounts.id.initialize({
          client_id: '330432503289-e4ufv921aq1jdh7lponqfi1jo8o5bs5u.apps.googleusercontent.com',
          callback: window.handleGoogleCallback,
          auto_select: false,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        });

        console.log('Google button rendered successfully');
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

  return (
    <div className="w-full">
      <div ref={buttonRef} className={disabled ? 'pointer-events-none opacity-50' : ''}></div>
      {disabled && (
        <div className="mt-2 text-sm text-gray-500">
          Please wait...
        </div>
      )}
    </div>
  );
};

export default SimpleGoogleSignIn;