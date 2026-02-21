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

export function UserManagement() {
  const { profile, isLoading } = useUserProfile();

  const getUsernameFromEmail = (email: string) => {
    return email.split('@')[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User & Role Management</CardTitle>
        <CardDescription>
          User management is limited. New users are automatically assigned roles
          upon their first login.
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
             To create a new user, use the Firebase Authentication console. New users will be assigned the 'staff' role by default.
            </li>
             <li>
              To make a user an admin, you must manually edit their 'role' field in the Firestore 'users' collection.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
