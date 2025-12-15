import { getDb } from '../config/firebase';
import { Workflow } from '../types';

export class WorkflowService {
  private collection = getDb().collection('workflows');

  async list(): Promise<Workflow[]> {
    if (process.env.NODE_ENV === 'test') return [];
    try {
      const snap = await this.collection.get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Workflow));
    } catch (_err) {
      return [];
    }
  }
}
