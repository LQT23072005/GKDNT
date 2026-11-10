// Firebase's runtime exports this function for React Native, but its default
// public declaration file omits it. Keep this declaration scoped to the API used.
import "firebase/auth";
import type { Persistence } from "firebase/auth";
declare module "firebase/auth" {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
