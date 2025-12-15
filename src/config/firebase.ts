import * as admin from 'firebase-admin';
let initialized = false;
export function initializeFirebase() {
  if (initialized) return;
  try {
    const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sa = require(path);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    initialized = true;
    console.log('Firebase initialized (service account)');
    return;
  } catch (_e) {
    try {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
      initialized = true;
      console.log('Firebase initialized (ADC)');
    } catch (_err) {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-test' });
      initialized = true;
      console.warn('Firebase initialized with fallback projectId (demo-test)');
    }
  }
}
export const getAdmin = () => admin;
export const getDb = () => admin.firestore();
export const getAuth = () => admin.auth();
