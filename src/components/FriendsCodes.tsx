import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { User } from '@supabase/supabase-js';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import Footer from '@/components/ui/footer';

interface Friend {
  id: string;
  friend_personal_code: string;
  friend_display_name: string;
  friend_first_name: string | null;
  friend_last_name: string | null;
}

interface FriendsCodesProps {
  user: User;
  onBack: () => void;
}

const FriendsCodes = ({ user, onBack }: FriendsCodesProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  
  useBackNavigation({
    onBackNavigation: onBack,
    isActive: true
  });
  const [newCode, setNewCode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setFriends(data);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const addFriend = async () => {
    if (!newCode.trim() || newCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);

    try {
      // Use secure lookup function instead of direct table access
      const { data: profileData, error: profileError } = await supabase
        .rpc('lookup_friend_by_personal_code', { _personal_code: newCode.trim() })
        .single();

      if (profileError || !profileData) {
        console.log('Profile error:', profileError);
        toast({
          title: "Friend Not Found",
          description: "No user found with this personal code",
          variant: "destructive"
        });
        setIsAdding(false);
        return;
      }

      // Check if user is trying to add themselves
      if (profileData.user_id === user.id) {
        toast({
          title: "Cannot Add Yourself",
          description: "You cannot add your own personal code",
          variant: "destructive"
        });
        setIsAdding(false);
        return;
      }

      // Check if already added
      const existingFriend = friends.find(f => f.friend_personal_code === newCode.trim());
      if (existingFriend) {
        toast({
          title: "Already Added",
          description: "This friend is already in your list",
          variant: "destructive"
        });
        setIsAdding(false);
        return;
      }

      // Add friend
      const { error: insertError } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_personal_code: newCode.trim(),
          friend_display_name: profileData.display_name || 'Unknown',
          friend_first_name: profileData.first_name,
          friend_last_name: profileData.last_name
        });

      if (insertError) {
        toast({
          title: "Error",
          description: "Failed to add friend",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Friend added successfully!",
        });
        setNewCode('');
        loadFriends();
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      toast({
        title: "Error",
        description: "Failed to add friend",
        variant: "destructive"
      });
    }

    setIsAdding(false);
  };

  const removeFriend = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove friend",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Friend removed successfully!",
        });
        loadFriends();
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#4C1D95]">
      {/* Animated background */}
      <div className="auth-animated-bg" />
      
      <div className="min-h-screen w-full relative z-10 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              Friends Codes
            </h1>
            <Button 
              variant="outline" 
              onClick={onBack} 
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
        </div>

        {/* Add Friend Section */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-black">Add Friend</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter 6-digit code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                maxLength={6}
                className="flex-1 text-black"
              />
              <Button 
                onClick={addFriend} 
                disabled={isAdding}
                className="text-black"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Friends List */}
        <div className="space-y-3">
          {friends.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-black">No friends added yet</p>
              </CardContent>
            </Card>
          ) : (
            friends.map((friend) => (
              <Card key={friend.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-black">
                      {friend.friend_display_name}
                    </div>
                    <div className="text-sm text-black opacity-75">
                      Code: {friend.friend_personal_code}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(friend.friend_personal_code);
                        toast({
                          title: "Copied!",
                          description: "Friend code copied to clipboard"
                        });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
                    >
                      📋
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFriend(friend.id)}
                      className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <Footer />
      </div>
      </div>
    </div>
  );
};

export default FriendsCodes;