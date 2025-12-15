import { getDb } from '../config/firebase';
import { Document } from '../types';

export class DocumentService {
  private collection = getDb().collection('documents');

  async list(): Promise<Document[]> {
    try {
      const snap = await this.collection.get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Document));
    } catch (_err) {
      return [];
    }
  }
}
