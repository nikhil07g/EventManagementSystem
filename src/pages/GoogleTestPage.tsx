import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SimpleGoogleSignIn from '@/components/SimpleGoogleSignIn';

const GoogleTestPage = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleSuccess = async (credential: string) => {
    addLog('✅ Google credential received');
    addLog(`Credential length: ${credential.length}`);
    
    try {
      addLog('🔄 Sending to backend...');
      const response = await fetch('http://localhost:4000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          role: 'user'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        addLog('✅ Backend authentication successful');
        addLog(`User: ${data.user.name} (${data.user.email})`);
        addLog(`Role: ${data.user.role}`);
      } else {
        addLog(`❌ Backend error: ${data.message}`);
      }
    } catch (error) {
      addLog(`❌ Network error: ${error}`);
    }
  };

  const handleError = (error: any) => {
    addLog(`❌ Google Sign-In error: ${error}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testBackend = async () => {
    try {
      addLog('🔄 Testing backend connection...');
      const response = await fetch('http://localhost:4000/api/health');
      const data = await response.json();
      addLog(`✅ Backend response: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`❌ Backend connection failed: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Google OAuth Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Google Sign-In Test</h2>
            
            <div className="space-y-4">
              <SimpleGoogleSignIn
                onSuccess={handleSuccess}
                onError={handleError}
                role="user"
              />
              
              <Button onClick={testBackend} variant="outline" className="w-full">
                Test Backend Connection
              </Button>
              
              <Button onClick={clearLogs} variant="outline" className="w-full">
                Clear Logs
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet. Try signing in with Google...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
        
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Check</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Frontend URL:</strong> http://localhost:8080
            </div>
            <div>
              <strong>Backend URL:</strong> http://localhost:4000
            </div>
            <div>
              <strong>Google Client ID:</strong> 330432503289-e4ufv921aq1jdh7lponqfi1jo8o5bs5u.apps.googleusercontent.com
            </div>
            <div>
              <strong>Expected Origins:</strong> http://localhost:8080
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GoogleTestPage;