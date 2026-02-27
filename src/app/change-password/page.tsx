'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { updatePassword } from 'firebase/auth';
import { useAuth, useFirebase } from '@/firebase/provider';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
import { doc } from 'firebase/firestore';
import { AuthGuard } from '@/components/AuthGuard';

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
        setError('Password should be at least 8 characters long.');
        return;
    }

    setIsLoading(true);
    setError(null);

    if (!user || !firestore) {
        setError('User not authenticated or database not available.');
        setIsLoading(false);
        return;
    }

    try {
      await updatePassword(user, newPassword);

      const userProfileRef = doc(firestore, 'users', user.uid);
      updateDocumentNonBlocking(userProfileRef, { mustChangePassword: false });

      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      const redirectUrl = searchParams.get('redirect') || '/';
      router.replace(redirectUrl);
    } catch (error: any) {
      let friendlyMessage = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/requires-recent-login') {
          friendlyMessage = "For security, please sign in again before changing your password.";
          // We could redirect to login here, but for simplicity, we'll just show the message.
      } else if (error.code === 'auth/weak-password') {
          friendlyMessage = "Password is too weak. It should be at least 8 characters long.";
      }
      setError(friendlyMessage);
      toast({
        variant: 'destructive',
        title: 'Password Change Failed',
        description: friendlyMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
      <Card className="w-full max-w-sm">
        <form onSubmit={handleChangePassword}>
          <CardHeader className="text-center">
             <div className="flex justify-center mb-4">
                 <KeyRound className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Change Your Password</CardTitle>
            <CardDescription>
              This is a one-time setup. Please choose a new, secure password.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
             {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Set New Password and Continue
            </Button>
          </CardFooter>
        </form>
      </Card>
  )
}

export default function ChangePasswordPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <AuthGuard>
                <ChangePasswordForm />
            </AuthGuard>
        </div>
    )
}
