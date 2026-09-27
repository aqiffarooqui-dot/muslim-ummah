import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../firebase/firestore';

export type Announcement = {
  id: string;
  title: string;
  message: string;
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
};

export type PaymentRecord = {
  id: string;
  userId: string;
  email: string;
  planId: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';
  paymentId: string;
  createdAt?: any;
};

export type AnalyticsEvent = {
  id: string;
  event: string;
  userId?: string;
  screen?: string;
  createdAt?: any;
  metadata?: Record<string, unknown>;
};

const announcementsRef = collection(db, 'announcements');
const paymentsRef = collection(db, 'payments');
const analyticsRef = collection(db, 'analytics');

export async function getAnnouncements(): Promise<Announcement[]> {
  const snap = await getDocs(
    query(announcementsRef, orderBy('createdAt', 'desc'), limit(100))
  );
  return snap.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Announcement, 'id'>),
  }));
}

export async function createAnnouncement(
  title: string,
  message: string,
  active = true
): Promise<void> {
  await addDoc(announcementsRef, {
    title: title.trim(),
    message: message.trim(),
    active,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function toggleAnnouncement(
  id: string,
  active: boolean
): Promise<void> {
  await updateDoc(doc(db, 'announcements', id), {
    active,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, 'announcements', id));
}

export async function getPaymentRecords(): Promise<PaymentRecord[]> {
  const snap = await getDocs(
    query(paymentsRef, orderBy('createdAt', 'desc'), limit(500))
  );
  return snap.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<PaymentRecord, 'id'>),
  }));
}

export async function createPaymentRecord(
  record: Omit<PaymentRecord, 'id' | 'createdAt'>
): Promise<void> {
  await addDoc(paymentsRef, {
    ...record,
    createdAt: serverTimestamp(),
  });
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentRecord['status']
): Promise<void> {
  await updateDoc(doc(db, 'payments', id), { status });
}

export async function getAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  const snap = await getDocs(
    query(analyticsRef, orderBy('createdAt', 'desc'), limit(1000))
  );
  return snap.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<AnalyticsEvent, 'id'>),
  }));
}

export async function trackAnalyticsEvent(
  event: string,
  userId?: string,
  screen?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await addDoc(analyticsRef, {
    event,
    userId: userId ?? null,
    screen: screen ?? null,
    metadata: metadata ?? null,
    createdAt: serverTimestamp(),
  });
}
