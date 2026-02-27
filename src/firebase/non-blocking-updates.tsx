'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

const handleFirestoreError = (error: any, operation: string, path: string, data?: any) => {
    if (error.code === 'permission-denied') {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: path,
                operation: operation as 'get' | 'list' | 'create' | 'update' | 'delete' | 'write',
                requestResourceData: data,
            })
        );
    } else if (error.code === 'unavailable') {
        toast({
            variant: "destructive",
            title: "CRITICAL: Connection Blocked by Firewall",
            description: `The '${operation}' operation failed because your PC's firewall is blocking the connection to the local database. Please allow the app through your firewall to continue.`,
            duration: 20000,
        });
    } else {
        console.warn(`[Firebase Firestore] Error during non-blocking ${operation} on ${path}:`, error);
    }
};


/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    const operation = options && 'merge' in options ? 'update' : 'create';
    handleFirestoreError(error, operation, docRef.path, data);
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      handleFirestoreError(error, 'create', colRef.path, data);
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
      handleFirestoreError(error, 'update', docRef.path, data);
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      handleFirestoreError(error, 'delete', docRef.path);
    });
}
