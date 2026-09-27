import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { auth } from '../firebase/auth';
import { getBookmarks } from '../quranBookmarks';
import { getQuranProgress } from '../quranProgress';
const SYNC_KEY='@muslim_ummah_last_cloud_sync';
export type CloudSyncPayload={bookmarks:{surahNumber:number;ayahNumber:number}[];progress:{surahNumber:number;ayahNumber:number}|null;updatedAt:string};
export async function syncPremiumData():Promise<void>{const user=auth.currentUser;if(!user)throw new Error('Sign in is required for Cloud Sync.');const payload:CloudSyncPayload={bookmarks:getBookmarks(),progress:await getQuranProgress(),updatedAt:new Date().toISOString()};await setDoc(doc(db,'userPrivateData',user.uid),{premiumSync:payload},{merge:true});await AsyncStorage.setItem(SYNC_KEY,payload.updatedAt);}
export async function restorePremiumData():Promise<CloudSyncPayload|null>{const user=auth.currentUser;if(!user)throw new Error('Sign in is required for Cloud Sync.');const snap=await getDoc(doc(db,'userPrivateData',user.uid));if(!snap.exists())return null;return (snap.data()?.premiumSync as CloudSyncPayload|undefined)??null;}
export async function getLastCloudSync():Promise<string|null>{return AsyncStorage.getItem(SYNC_KEY);}