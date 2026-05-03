import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

let _adminApp: App | undefined

function getAdminApp(): App {
  if (_adminApp) return _adminApp
  if (getApps().length > 0) {
    _adminApp = getApps()[0]
    return _adminApp
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    throw new Error('Firebase Admin SDK is not configured. Add FIREBASE_ADMIN_* env vars.')
  }

  _adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      privateKey,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    }),
  })

  return _adminApp
}

export function adminDb() {
  return getFirestore(getAdminApp())
}

export function adminAuth() {
  return getAuth(getAdminApp())
}
