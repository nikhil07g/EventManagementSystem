import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const OriginDebugger = () => {
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  
  useEffect(() => {
    setCurrentOrigin(window.location.origin);
    setCurrentUrl(window.location.href);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Google OAuth Origin Debugger</h1>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current URL Information</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold text-sm text-gray-600 mb-2">CURRENT ORIGIN (Add this to Google Console)</h3>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono bg-green-100 px-2 py-1 rounded flex-1">
                  {currentOrigin}
                </code>
                <Button 
                  onClick={() => copyToClipboard(currentOrigin)}
                  size="sm"
                  variant="outline"
                >
                  Copy
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold text-sm text-gray-600 mb-2">FULL CURRENT URL</h3>
              <code className="text-sm font-mono break-all">
                {currentUrl}
              </code>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Google Console Setup Instructions</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold">1. Go to Google Cloud Console</h3>
              <p className="text-sm text-gray-600">
                Navigate to APIs & Services → Credentials
              </p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold">2. Find Your OAuth Client</h3>
              <p className="text-sm text-gray-600">
                Client ID: 330432503289-e4ufv921aq1jdh7lponqfi1jo8o5bs5u.apps.googleusercontent.com
              </p>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-semibold">3. Add JavaScript Origins</h3>
              <p className="text-sm text-gray-600">
                Add the origin shown above to "Authorized JavaScript origins"
              </p>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold">4. Save and Wait</h3>
              <p className="text-sm text-gray-600">
                Save changes and wait 2-3 minutes for propagation
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Button 
            onClick={() => window.location.href = 'http://localhost:8080/organizer-login'}
            className="mr-4"
          >
            Test Organizer Login
          </Button>
          <Button 
            onClick={() => window.location.href = 'http://localhost:8080/user-login'}
            variant="outline"
          >
            Test User Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OriginDebugger;