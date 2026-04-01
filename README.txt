MALIN FLOW — CHROME + IPHONE SYNC VERSION

WHAT THIS IS
- A mobile-first web app that works on iPhone and in Chrome on Mac.
- Same app on both devices.
- Shared updates between devices when you connect Firebase Firestore.
- If Firebase is not configured yet, it runs in local demo mode.

FILES
- index.html = main app
- manifest.json = makes it more app-like
- sw.js = service worker for installability
- firebase-config.js = currently demo mode
- firebase-config.example.js = template for your real Firebase config

TO MAKE PHONE + MAC STAY IN SYNC
You need a shared cloud database. This bundle is prepared for Firebase Firestore.

HIGH-LEVEL SETUP
1. Create a Firebase project.
2. Create a Firestore database.
3. Register a Web App in Firebase.
4. Copy the Firebase Web Config into firebase-config.js.
5. Host this folder online, for example with Firebase Hosting, Netlify, or Vercel.
6. Open the same URL on iPhone and Mac Chrome.
7. Use the same workspace query string on both devices if needed.

IMPORTANT
Without hosting + Firebase config, the phone and Mac will NOT update each other.

SUGGESTED FIRST TEST
- Host the app.
- Open it on your Mac.
- Open the same URL on your iPhone.
- Add one task on the iPhone.
- Check the Mac version.

