import { initializeApp, deleteApp } from "firebase/app";
import {
  initializeAuth,
  inMemoryPersistence,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { firebaseConfig } from "./config";

// Registration uses an isolated in-memory session. The main auth listener never
// receives the newly registered user, even briefly, and no login is persisted.
export async function registerAccount(email: string, password: string) {
  const app = initializeApp(firebaseConfig, `registration-${Date.now()}`);
  try {
    const auth = initializeAuth(app, { persistence: inMemoryPersistence });
    await createUserWithEmailAndPassword(auth, email, password);
    await signOut(auth);
  } finally {
    await deleteApp(app);
  }
}
