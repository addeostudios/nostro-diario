import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  FirestoreError 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { OperationType, Photo, Badge, Couple, UserProfile, ImportantDate } from '../types';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, additionalContext?: any) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path,
    context: additionalContext
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const dbService = {
  // Users
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as UserProfile : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${uid}`);
      return null;
    }
  },

  async setUserProfile(profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', profile.uid), profile);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${profile.uid}`);
    }
  },

  // Couples
  async getCouple(coupleId: string): Promise<Couple | null> {
    try {
      const docRef = doc(db, 'couples', coupleId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as Couple : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `couples/${coupleId}`, { coupleId });
      return null;
    }
  },

  async createCouple(couple: Couple): Promise<void> {
    try {
      await setDoc(doc(db, 'couples', couple.id), couple);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `couples/${couple.id}`, { couple });
    }
  },

  // Photos
  subscribePhotos(coupleId: string, callback: (photos: Photo[]) => void) {
    const q = query(
      collection(db, 'photos'),
      where('coupleId', '==', coupleId),
      orderBy('dateTaken', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Photo)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'photos', { coupleId });
    });
  },

  async addPhoto(photo: Photo): Promise<void> {
    try {
      await setDoc(doc(db, 'photos', photo.id), photo);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `photos/${photo.id}`, { photo });
    }
  },

  async deletePhoto(photoId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'photos', photoId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `photos/${photoId}`);
    }
  },

  // Badges
  subscribeBadges(coupleId: string, callback: (badges: Badge[]) => void) {
    const q = query(
      collection(db, 'badges'),
      where('coupleId', '==', coupleId)
    );
    
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Badge)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'badges', { coupleId });
    });
  },

  async addBadge(badge: Badge): Promise<void> {
    try {
      await setDoc(doc(db, 'badges', badge.id), badge);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `badges/${badge.id}`, { badge });
    }
  },

  async deleteBadge(badgeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'badges', badgeId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `badges/${badgeId}`);
    }
  },

  // Important Dates
  subscribeDates(coupleId: string, callback: (dates: ImportantDate[]) => void) {
    const q = query(
      collection(db, 'importantDates'),
      where('coupleId', '==', coupleId)
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ImportantDate)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'importantDates', { coupleId });
    });
  },

  async addDate(date: ImportantDate): Promise<void> {
    try {
      await setDoc(doc(db, 'importantDates', date.id), date);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `importantDates/${date.id}`, { date });
    }
  },

  async deleteDate(dateId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'importantDates', dateId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `importantDates/${dateId}`);
    }
  },

  async updateUserSettings(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), data, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`, { data });
    }
  },
};
