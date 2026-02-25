
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast({
        title: 'Login Successful',
        description: 'You have been successfully signed in.',
      });
      const redirectUrl = searchParams.get('redirect') || '/';
      router.replace(redirectUrl);
    } catch (error: any) {
      setError(getFriendlyAuthErrorMessage(error.code));
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: getFriendlyAuthErrorMessage(error.code),
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getFriendlyAuthErrorMessage = (code: string) => {
    switch (code) {
        case 'auth/invalid-email':
            return "The email address is not valid.";
        case 'auth/user-disabled':
            return "This user account has been disabled.";
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return "Invalid email or password.";
        default:
            return "An unexpected error occurred. Please try again.";
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-4 right-4">
         <ThemeSwitcher />
       </div>
      <Card className="w-full max-w-sm">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                 <KeyRound className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin & Staff Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
             {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
