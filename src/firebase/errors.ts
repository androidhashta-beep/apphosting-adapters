
'use client';

// NOTE: No imports from 'firebase/app' or 'firebase/auth' to ensure server-side compatibility.

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

interface SecurityRuleRequest {
  auth: null; // Auth object is always null in this server-safe version.
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

/**
 * Builds a server-safe, simulated request object. It does not include auth details.
 * @param context The context of the failed Firestore operation.
 * @returns A structured request object with auth set to null.
 */
function buildRequestObject(context: SecurityRuleContext): SecurityRuleRequest {
  return {
    auth: null,
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
  };
}

/**
 * Builds the final, formatted error message.
 * @param requestObject The simulated request object.
 * @returns A string containing the error message and the JSON payload.
 */
function buildErrorMessage(requestObject: SecurityRuleRequest): string {
  // NOTE: This message is now slightly different. It no longer promises full auth context.
  return `FirestoreError: Missing or insufficient permissions. The request was denied by Firestore Security Rules.
Request context (auth details are not available in this view):
${JSON.stringify(requestObject, null, 2)}`;
}

/**
 * A custom error class that is safe to use in Next.js server and client environments.
 * It structures error information to mimic a security rule request object but
 * deliberately omits auth details to prevent server crashes.
 */
export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    const requestObject = buildRequestObject(context);
    super(buildErrorMessage(requestObject));
    this.name = 'FirestorePermissionError'; // More specific name for debugging.
    this.request = requestObject;

    // Maintains the prototype chain for 'instanceof' checks.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
