'use client';

import { useState, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import type { UserProfile, UserRole } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, PlusCircle } from 'lucide-react';

export function UserManagement() {
  const { firestore, user: currentUser } = useFirebase();
  const { toast } = useToast();

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<UserProfile>(usersCollectionRef);

  // Use local state to manage role changes before saving
  const [userRoles, setUserRoles] = useState<{ [uid: string]: UserRole }>({});

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email));
  }, [users]);
  
  const handleRoleChange = (uid: string, role: UserRole) => {
    setUserRoles(prev => ({ ...prev, [uid]: role }));
  };

  const handleSaveChanges = (uid: string) => {
    if (!firestore) return;
    const newRole = userRoles[uid];
    if (newRole) {
      const userDocRef = doc(firestore, 'users', uid);
      updateDocumentNonBlocking(userDocRef, { role: newRole });
      toast({
        title: 'Role Updated',
        description: `The role has been successfully updated to ${newRole}.`,
      });
      // Clear the pending change for this user
      setUserRoles(prev => {
        const newRoles = { ...prev };
        delete newRoles[uid];
        return newRoles;
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User & Role Management</CardTitle>
        <CardDescription>
          View users and assign roles. Users are automatically added here upon their first login.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[120px]">Role</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : sortedUsers.length > 0 ? (
                sortedUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.displayName || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={userRoles[user.uid] || user.role}
                        onValueChange={(value: UserRole) => handleRoleChange(user.uid, value)}
                        // Disable role change for the current admin user to prevent self-lockout
                        disabled={user.uid === currentUser?.uid}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button
                        size="sm"
                        onClick={() => handleSaveChanges(user.uid)}
                        // Disable if no change is pending
                        disabled={!userRoles[user.uid]}
                      >
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
         <div className="text-xs text-muted-foreground mt-4">
            <p className="font-bold">Note:</p>
            <ul className="list-disc pl-5 mt-1">
                <li>Users are automatically added to this list with the 'staff' role when they first sign in to the application.</li>
                <li>To add a new user, create their account in the <strong>Firebase Authentication console</strong>, then have them log in once.</li>
                <li>An admin cannot change their own role to prevent accidental lock-out.</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );
}
