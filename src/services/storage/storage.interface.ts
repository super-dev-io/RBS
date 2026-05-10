export interface StoredFile {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface StorageDriver {
  save(params: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredFile>;

  read(key: string): Promise<Buffer>;

  delete(key: string): Promise<void>;

  resolveUrl(key: string): string;
}
