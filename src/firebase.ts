import { initializeApp, getApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig, isConfigured } from "./config";
function setup() {
  if (!isConfigured) return null;
  const existing = getApps().length > 0;
  const app = existing ? getApp() : initializeApp(firebaseConfig);
  const auth = existing
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
  return { auth, db: getFirestore(app) };
}
export const firebase = setup();
