import {
  doc,
  getFirestore,
  updateDoc,
} from 'firebase/firestore';

import { firebaseApp } from '../firebase/firebaseConfig';

const db = getFirestore(firebaseApp);

export async function updateUserDisplayName(
  uid: string,
  displayName: string
): Promise<void> {
  const userRef = doc(
    db,
    'users',
    uid
  );

  await updateDoc(userRef, {
    displayName:
      displayName.trim(),
  });
}
