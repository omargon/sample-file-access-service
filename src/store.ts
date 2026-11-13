import { User, Sample, FileRecord } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'user-1', name: 'User 1', apiKey: 'user1-key' },
  { id: 'user-2', name: 'User 2', apiKey: 'user2-key' },
  { id: 'pipeline-user', name: 'QC Pipeline', apiKey: 'pipeline-key', isPipeline: true },
];

export class Store {
  private users: Map<string, User> = new Map();
  private usersByApiKey: Map<string, User> = new Map();
  private samples: Map<string, Sample> = new Map();
  private files: Map<string, FileRecord> = new Map();

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.users.clear();
    this.usersByApiKey.clear();
    this.samples.clear();
    this.files.clear();

    for (const user of INITIAL_USERS) {
      this.users.set(user.id, user);
      this.usersByApiKey.set(user.apiKey, user);
    }
  }

  public getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByApiKey(apiKey: string): User | undefined {
    return this.usersByApiKey.get(apiKey);
  }

  public getSample(id: string): Sample | undefined {
    return this.samples.get(id);
  }

  public saveSample(sample: Sample): void {
    this.samples.set(sample.id, sample);
  }

  public getFile(id: string): FileRecord | undefined {
    return this.files.get(id);
  }

  public saveFile(file: FileRecord): void {
    this.files.set(file.id, file);
  }
}

export const store = new Store();
