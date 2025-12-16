import { z } from 'zod';
import { getDb, getAuth } from '../config/firebase';
import { User } from '../types';

export const leadSchema = z.object({
  company: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(5),
});

export class LeadService {
  private collection = getDb().collection('leads');

  async create(payload: z.infer<typeof leadSchema>) {
    const data = { ...payload, status: 'new', createdAt: new Date() };
    const doc = await this.collection.add(data);
    return { id: doc.id, ...data };
  }

  async list() {
    const snap = await this.collection.orderBy('createdAt', 'desc').get();
    return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
  }

  async updateStatus(id: string, status: string) {
    await this.collection.doc(id).update({ status, updatedAt: new Date() });
  }

  async approve(id: string) {
    const ref = this.collection.doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Lead not found');
    const lead = snap.data() as any;

    // Create Firebase Auth user (email only)
    const userRecord = await getAuth().createUser({ email: lead.email });

    // Create Firestore user profile
    await getDb().collection('users').doc(userRecord.uid).set({
      role: 'installer',
      status: 'approved',
      company: lead.company,
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      createdAt: new Date(),
    });

    // Mark lead
    await ref.update({ status: 'approved', approvedUserId: userRecord.uid, approvedAt: new Date() });

    return { leadId: id, userId: userRecord.uid, email: lead.email };
  }
}
