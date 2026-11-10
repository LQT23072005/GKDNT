import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig, isConfigured } from './config';
function setup() {
  if (!isConfigured) return null;
  const app = getApps().some(app => app.name === '[DEFAULT]') ? getApp() : initializeApp(firebaseConfig);
  return { auth: getAuth(app), db: getFirestore(app) };
}
export const firebase = setup();
