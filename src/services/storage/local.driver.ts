import fs from "fs/promises";
import path from "path";
import { env } from "../../config/env";
import { StorageDriver, StoredFile } from "./storage.interface";

export class LocalStorageDriver implements StorageDriver {
  private root: string;

  constructor(root = env.STORAGE_LOCAL_DIR) {
    this.root = path.resolve(root);
  }

  private resolve(key: string): string {
    const safe = key.replace(/^\/+/, "").replace(/\.\./g, "");
    return path.join(this.root, safe);
  }

  async save({
    key,
    body,
    contentType,
  }: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredFile> {
    const fullPath = this.resolve(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, body);
    return {
      key,
      url: this.resolveUrl(key),
      size: body.length,
      contentType,
    };
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }
  }

  resolveUrl(key: string): string {
    const safe = key.replace(/^\/+/, "");
    return `${env.PUBLIC_BASE_URL}/files/${encodeURI(safe)}`;
  }
}
