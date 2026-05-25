import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
console.log("Initializing Firebase with project:", firebaseConfig.projectId);
console.log("Target Database ID:", firebaseConfig.firestoreDatabaseId || "(default)");

const app = initializeApp(firebaseConfig);

// We use experimentalForceLongPolling to avoid issues with GRPC streams 
// in some containerized or restricted environments which manifest as "offline".
const firestoreSettings = {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
};

// CRITICAL: Initialize with the specific database ID from config
let dbInstance;
const dbId = firebaseConfig.firestoreDatabaseId;

try {
  if (dbId && dbId !== "(default)") {
    console.log("Using primary database ID:", dbId);
    dbInstance = initializeFirestore(app, firestoreSettings, dbId);
  } else {
    console.log("Using (default) database.");
    dbInstance = initializeFirestore(app, firestoreSettings);
  }
} catch (e) {
  console.warn("Failed to initialize with named database, falling back to default:", e);
  dbInstance = initializeFirestore(app, firestoreSettings);
}

export const db = dbInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  console.log("Triggering loginWithGoogle...");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Authentication successful, user:", result.user.email);
    return result;
  } catch (error: any) {
    console.error("Critical Auth Failure:", error.code, error.message);
    if (error.code === 'auth/popup-blocked') {
      console.error("Popup was blocked by the browser. Please allow popups for this site.");
    } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      console.warn("User cancelled the login process.");
    }
    throw error;
  }
};

export const logout = () => {
  console.log("Logging out user...");
  return signOut(auth);
};

// Robust exponential backoff retry for connecting to Firestore server
async function retryGetDocFromServer(docRef: any, maxRetries = 5, delayMs = 1500): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      console.log(`Connection attempt ${attempt + 1}/${maxRetries} to doc '${docRef.path}'...`);
      return await getDocFromServer(docRef);
    } catch (e: any) {
      attempt++;
      const isRetryable = e.message?.toLowerCase().includes('offline') || 
                          e.message?.toLowerCase().includes('failed to get document') ||
                          e.code === 'unavailable';
      if (isRetryable && attempt < maxRetries) {
        const nextDelay = delayMs * Math.pow(2, attempt - 1);
        console.warn(`⚠️ Firestore connection attempt ${attempt} failed: ${e.message}. Retrying in ${nextDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, nextDelay));
      } else {
        throw e;
      }
    }
  }
}

// Validate connection and config integrity
export async function testConnection() {
  console.log("Checking Firestore connectivity...");
  try {
    const docRef = doc(db, '_connection_test_', 'check');
    console.log(`Pinging database: ${firebaseConfig.firestoreDatabaseId || '(default)'}`);
    console.log("Waiting for network handshake...");
    
    // Give it a small delay to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    const snap = await retryGetDocFromServer(docRef);
    
    if (snap) {
      console.log("✅ Firestore connected and operational.");
    }
  } catch (error: any) {
    console.error("❌ Firestore connection test failed after all retries:", error);
    
    if (error?.code === 'permission-denied') {
      console.error("Rule Conflict: Permission denied. Check your Firestore security rules.");
    } else if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.error("Network Link Failure: Client is offline or service is unreachable. Verify your Database ID and Project ID.");
    } else {
      console.error(`Link Error [${error?.code}]: ${error?.message}`);
    }
  }
}

// Automatically test connection in dev/debug (only in browser)
if (typeof window !== 'undefined') {
  testConnection();
}
