import { getStorageConfig } from "../../config/storage";
import { CloudinaryStorageProvider } from "./cloudinary.provider";
import { DisabledStorageProvider } from "./disabled.provider";
import { TestStorageProvider } from "./test.provider";
import { StorageProvider, StorageProviderName } from "./types";

const instances: Partial<Record<StorageProviderName, StorageProvider>> = {};

function createProvider(name: StorageProviderName): StorageProvider {
  switch (name) {
    case "cloudinary":
      return new CloudinaryStorageProvider();
    case "test":
      return new TestStorageProvider();
    default:
      return new DisabledStorageProvider();
  }
}

export function getStorageProvider(): StorageProvider {
  const name = getStorageConfig().provider;
  if (!instances[name]) instances[name] = createProvider(name);
  return instances[name]!;
}

export function resetStorageProvider(): void {
  for (const key of Object.keys(instances) as StorageProviderName[]) {
    delete instances[key];
  }
}

export * from "./types";
export { CloudinaryStorageProvider } from "./cloudinary.provider";
export { DisabledStorageProvider } from "./disabled.provider";
export { TestStorageProvider } from "./test.provider";
