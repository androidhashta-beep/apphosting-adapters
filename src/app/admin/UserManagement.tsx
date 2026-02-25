
'use client';

import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { firebaseConfig } from '@/firebase/config';

export function UserManagement() {
  const { profile, isLoading } = useUserProfile();
  const projectId = firebaseConfig.projectId;
  const firestoreUsersUrl = `https://console.firebase.google.com/project/${projectId}/firestore/data/~2Fusers`;

  const getUsernameFromEmail = (email: string) => {
    if (email === 'anonymous-user') return 'anonymous';
    return email.split('@')[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User & Role Management</CardTitle>
        <CardDescription>
          This panel displays your current user profile and role. To become an admin, your role must be changed in the Firestore database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                </TableRow>
              ) : profile ? (
                <TableRow>
                  <TableCell className="font-medium">
                    {profile.displayName || 'N/A'}
                  </TableCell>
                  <TableCell>{getUsernameFromEmail(profile.email)}</TableCell>
                  <TableCell className="capitalize">{profile.role}</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Could not load your user profile.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          <p className="font-bold">Note:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>
              This panel currently only displays your own profile.
            </li>
            <li>
             To make a user an admin, you must manually edit their 'role' field in the Firestore 'users' collection from 'staff' to 'admin'.
            </li>
            <li>
               <Button asChild variant="link" className="p-0 h-auto text-xs -ml-1">
                 <Link href={firestoreUsersUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                  Open Firebase Console to edit roles
                  <ExternalLink className="h-3 w-3" />
                 </Link>
               </Button>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
