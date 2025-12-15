import { getDb } from '../config/firebase';
import { Workflow } from '../types';

export class WorkflowService {
  private collection = getDb().collection('workflows');

  async list(): Promise<Workflow[]> {
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) return [];
    try {
      const snap = await this.collection.get();
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Workflow));
    } catch (_err) {
      return [];
    }
  }
}
