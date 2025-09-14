import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SignUpFormProps {}

export const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
            display_name: `${firstName} ${lastName}`
          }
        }
      });
      
      if (error) throw error;
      
        toast({
          title: "Success",
          description: "Account created! Please check your email to verify your account."
        });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-black">First Name *</label>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name"
            required
            className="bg-white text-black border-gray-300"
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-black">Last Name *</label>
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter last name"
            required
            className="bg-white text-black border-gray-300"
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium text-black">Phone Number</label>
        <Input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number"
          className="bg-white text-black border-gray-300"
          style={{ color: '#000000', backgroundColor: '#ffffff' }}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium text-black">Email *</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="bg-white text-black border-gray-300"
          style={{ color: '#000000', backgroundColor: '#ffffff' }}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium text-black">Password *</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          className="bg-white text-black border-gray-300"
          style={{ color: '#000000', backgroundColor: '#ffffff' }}
        />
      </div>

      <Button 
        onClick={handleSignUp}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
      >
        {loading ? "Processing..." : "Create Account"}
      </Button>
    </div>
  );
};