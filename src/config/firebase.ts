import * as admin from 'firebase-admin';
let initialized = false;
function ensureInit() {
  if (initialized) return;
  initializeFirebase();
}
export function initializeFirebase() {
  if (initialized) return;
  const fallbackProject = process.env.FIREBASE_PROJECT_ID || 'demo-test';
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
  const tryService = () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sa = require(path);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    initialized = true;
    console.log('Firebase initialized (service account)');
  };
  const tryADC = () => {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
    initialized = true;
    console.log('Firebase initialized (ADC)');
  };
  const tryFallback = () => {
    admin.initializeApp({ projectId: fallbackProject });
    initialized = true;
    console.warn(`Firebase initialized with fallback projectId (${fallbackProject})`);
  };

  try {
    tryService();
    return;
  } catch (_e) {}
  try {
    tryADC();
    return;
  } catch (_e) {}
  tryFallback();
}
export const getAdmin = () => admin;
export const getDb = () => {
  ensureInit();
  const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
  if (isTest) {
    const mem = {
      collection: () => ({
        data: [] as any[],
        async get() {
          return { docs: [] as any[] };
        },
        async add(_doc: any) {
          const id = `mem_${Date.now()}`;
          this.data.push({ id, ..._doc });
          return { id };
        }
      })
    };
    return mem as any;
  }
  return admin.firestore();
};
export const getAuth = () => {
  ensureInit();
  return admin.auth();
};
