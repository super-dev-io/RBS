import { env } from "../../config/env";
import { LocalStorageDriver } from "./local.driver";
import { StorageDriver } from "./storage.interface";

let instance: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (instance) return instance;
  switch (env.STORAGE_DRIVER) {
    case "local":
    default:
      instance = new LocalStorageDriver();
      break;
  }
  return instance;
}

export type { StorageDriver, StoredFile } from "./storage.interface";
