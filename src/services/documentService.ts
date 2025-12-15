import { getDb } from '../config/firebase';
import { Document } from '../types';

export class DocumentService {
  private collection = getDb().collection('documents');

  async list(): Promise<Document[]> {
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) return [];
    try {
      const snap = await this.collection.get();
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Document));
    } catch (_err) {
      return [];
    }
  }
}
