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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function UserManagement() {
  const { firestore, user: currentUser } = useFirebase();
  const { toast } = useToast();

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<UserProfile>(usersCollectionRef);

  const [userRoles, setUserRoles] = useState<{ [uid: string]: UserRole }>({});
  const [passwordChangeFlags, setPasswordChangeFlags] = useState<{ [uid: string]: boolean }>({});

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email));
  }, [users]);
  
  const handleRoleChange = (uid: string, role: UserRole) => {
    setUserRoles(prev => ({ ...prev, [uid]: role }));
  };

  const handlePasswordChangeFlagChange = (uid: string, mustChange: boolean) => {
    setPasswordChangeFlags(prev => ({ ...prev, [uid]: mustChange }));
  };

  const handleSaveChanges = (uid: string) => {
    if (!firestore) return;
    
    const userDocRef = doc(firestore, 'users', uid);
    const newRole = userRoles[uid];
    const mustChangePassword = passwordChangeFlags[uid];

    const dataToUpdate: Partial<UserProfile> = {};
    if (newRole) {
      dataToUpdate.role = newRole;
    }
    if (mustChangePassword !== undefined) {
      dataToUpdate.mustChangePassword = mustChangePassword;
    }

    if (Object.keys(dataToUpdate).length > 0) {
      updateDocumentNonBlocking(userDocRef, dataToUpdate);
      toast({
        title: 'User Updated',
        description: `The user's profile has been successfully updated.`,
      });
      // Clear the pending changes for this user
      setUserRoles(prev => {
        const newRoles = { ...prev };
        delete newRoles[uid];
        return newRoles;
      });
      setPasswordChangeFlags(prev => {
        const newFlags = { ...prev };
        delete newFlags[uid];
        return newFlags;
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
                <TableHead className="w-[200px]">Force Password Change</TableHead>
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
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`password-change-${user.uid}`}
                          checked={passwordChangeFlags[user.uid] ?? user.mustChangePassword ?? false}
                          onCheckedChange={(checked) => handlePasswordChangeFlagChange(user.uid, checked)}
                          disabled={user.uid === currentUser?.uid}
                          aria-label="Force password change"
                        />
                        <Label htmlFor={`password-change-${user.uid}`} className="cursor-pointer">Required</Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button
                        size="sm"
                        onClick={() => handleSaveChanges(user.uid)}
                        disabled={userRoles[user.uid] === undefined && passwordChangeFlags[user.uid] === undefined}
                      >
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
         <div className="text-xs text-muted-foreground mt-4">
            <p className="font-bold">Note:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Users are automatically added here with the 'staff' role upon their first login. The first user to sign in becomes an 'admin'.</li>
                <li><strong>To add a new user:</strong> create their account in the <strong>Firebase Authentication console</strong> with an email and a temporary password. Have them log in once to appear here.</li>
                <li>You can then use the <strong>"Force Password Change"</strong> switch to require them to set a new password on their next login.</li>
                <li>An admin cannot change their own role or force a password change on themselves to prevent accidental lock-out.</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );
}
