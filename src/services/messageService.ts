import { getDb } from '../config/firebase';
import { Message } from '../types';

const useMemory = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

export class MessageService {
  private static memory: Message[] = [];
  private collection = useMemory ? null : getDb().collection('messages');

  async list(projectId?: string): Promise<Message[]> {
    if (useMemory) {
      return MessageService.memory.filter((m) => !projectId || m.projectId === projectId);
    }
    try {
      let query: any = this.collection as any;
      if (projectId) query = query.where('projectId', '==', projectId);
      const snap = await query.get();
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Message));
    } catch (_err) {
      return [];
    }
  }

  async create(data: { projectId: string; content: string; senderId?: string; recipientId?: string }): Promise<Message> {
    const base: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      projectId: data.projectId,
      senderId: data.senderId || 'system',
      recipientId: data.recipientId,
      content: data.content,
      createdAt: new Date(),
      read: false,
    };

    if (useMemory) {
      MessageService.memory.push(base);
      return base;
    }
    try {
      const doc = await (this.collection as FirebaseFirestore.CollectionReference).add(base);
      return { ...base, id: doc.id };
    } catch (_err) {
      return base;
    }
  }

  async markRead(id: string): Promise<Message | null> {
    if (useMemory) {
      const idx = MessageService.memory.findIndex((m) => m.id === id);
      if (idx === -1) return null;
      MessageService.memory[idx].read = true;
      return MessageService.memory[idx];
    }
    try {
      const docRef = (this.collection as FirebaseFirestore.CollectionReference).doc(id);
      await docRef.update({ read: true });
      const snap = await docRef.get();
      return { id: snap.id, ...snap.data() } as Message;
    } catch (_err) {
      return null;
    }
  }
}
