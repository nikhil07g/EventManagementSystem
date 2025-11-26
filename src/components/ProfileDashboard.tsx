import { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, Edit, Save, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api, ApiError, type UserProfile } from '@/lib/api';
import { readSession, persistSession, clearSession, SESSION_KEYS, type SessionKey, type StoredSession } from '@/lib/session';

interface ProfileDashboardProps {
  userType: 'user' | 'organizer';
}

const ProfileDashboard = ({ userType }: ProfileDashboardProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const resolveSession = (): { key: SessionKey | null; session: StoredSession | null } => {
    const primaryKey = SESSION_KEYS[userType];
    const primarySession = readSession(primaryKey);
    if (primarySession) {
      return { key: primaryKey, session: primarySession };
    }

    if (userType === 'organizer') {
      const adminSession = readSession(SESSION_KEYS.admin);
      if (adminSession) {
        return { key: SESSION_KEYS.admin, session: adminSession };
      }
    }

    return { key: null, session: null };
  };

  const loadProfile = async () => {
    setLoading(true);
    let resolvedKey: SessionKey | null = null;
    try {
      const { key, session } = resolveSession();
      resolvedKey = key;

      if (!session || !key) {
        setProfile(null);
        return;
      }

      setProfile(session.user);
      setEditedName(session.user.name || '');

      const response = await api.auth.me(session.token);
      setProfile(response.user);
      setEditedName(response.user.name || '');
      persistSession(key, {
        token: session.token,
        user: response.user,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      if (error instanceof ApiError) {
        const description = error.status === 401 ? 'Session expired. Please sign in again.' : error.message;
        if (error.status === 401 && resolvedKey) {
          clearSession(resolvedKey);
          setProfile(null);
        }
        toast({
          title: 'Session Error',
          description,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load profile information.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, [userType]);

  const handleSaveProfile = () => {
    if (!profile) return;

    try {
      const { key, session } = resolveSession();
      if (!session || !key) {
        toast({
          title: 'No Active Session',
          description: 'Please sign in again to update your profile.',
          variant: 'destructive',
        });
        return;
      }

      const updatedUser: UserProfile = { ...session.user, name: editedName };
      persistSession(key, {
        token: session.token,
        user: updatedUser,
      });

      setProfile(updatedUser);
      setIsEditing(false);

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Not available';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 w-20 bg-gray-300 rounded-full mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No profile information available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback className="text-lg">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1">
              <Badge variant={userType === 'organizer' ? 'default' : 'secondary'}>
                <Shield className="w-3 h-3 mr-1" />
                {userType === 'organizer' ? 'Organizer' : 'User'}
              </Badge>
            </div>
          </div>

          <div className="text-center space-y-2">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-center"
                  placeholder="Enter your name"
                />
                <Button onClick={handleSaveProfile} size="sm">
                  <Save className="w-4 h-4" />
                </Button>
                <Button onClick={() => {
                  setIsEditing(false);
                  setEditedName(profile.name);
                }} size="sm" variant="outline">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <Button onClick={() => setIsEditing(true)} size="sm" variant="ghost">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{profile.email}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Details Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-500">Full Name</Label>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{profile.name}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-500">Email Address</Label>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{profile.email}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-500">Account Type</Label>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <Badge variant={userType === 'organizer' ? 'default' : 'secondary'}>
                {userType === 'organizer' ? 'Event Organizer' : 'Event Attendee'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-500">Member Since</Label>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                {profile.createdAt ? formatDate(profile.createdAt) : 'Welcome to EventHub!'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Security Card */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Account Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-green-800">Google Account Connected</p>
                <p className="text-sm text-green-600">
                  Signed in with Google OAuth - Enhanced security enabled
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Verified</Badge>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              • Your account is secured with Google's authentication system
            </p>
            <p>
              • Profile information is automatically synced from your Google account
            </p>
            <p>
              • Two-factor authentication is managed through your Google account settings
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfileDashboard;