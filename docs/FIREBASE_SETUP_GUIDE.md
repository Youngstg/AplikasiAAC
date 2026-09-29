# Firebase Realtime Database Setup Guide

Panduan lengkap setup Firebase Realtime Database untuk AplikasiAAC.

## Step 1: Create Realtime Database

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project: **aplikasiaac-4bbab**
3. Di sidebar kiri, klik **"Realtime Database"**
4. Klik **"Create Database"**
5. Pilih location: **asia-southeast1 (Singapore)** - terdekat dengan Indonesia
6. **PENTING**: Pilih **"Start in locked mode"** ✅

## Step 2: Apply Security Rules

### Option A: Via Firebase Console (Recommended)

1. Setelah database dibuat, klik tab **"Rules"** di atas
2. Copy isi file [firebase-database-rules.json](./firebase-database-rules.json)
3. Paste ke editor rules di Firebase Console
4. Klik **"Publish"**
5. ✅ Done!

### Option B: Via Firebase CLI

```bash
# Install Firebase CLI (jika belum)
npm install -g firebase-tools

# Login ke Firebase
firebase login

# Initialize Firebase di project folder
cd d:\Download\AplikasiAAC
firebase init database

# Pilih existing project: aplikasiaac-4bbab
# Rules file: firebase-database-rules.json

# Deploy rules
firebase deploy --only database
```

## Step 3: Enable Indexing for Better Performance

Indexes sudah didefinisikan di rules dengan `.indexOn`, tapi untuk memastikan:

1. Di Firebase Console, tab **"Rules"**
2. Verifikasi `.indexOn` ada di:
   - `parent-child-connections`: `["parentEmail", "childEmail", "parentId", "childId"]`
   - `parent-buttons`: `["parentEmail", "childEmail", "parentId", "childId"]`
   - `notifications`: `["toId", "toEmail", "fromId", "read"]`
   - `invite-codes`: `["code", "parentId", "used"]`
   - `favorites`: `["childEmail"]`

3. Save jika ada perubahan

## Step 4: Verify Database URL

Check bahwa `firebaseConfig.js` menggunakan URL yang benar:

```javascript
const firebaseConfig = {
  // ... other config
  databaseURL: "https://aplikasiaac-4bbab-default-rtdb.firebaseio.com",
  // ...
};
```

✅ URL sudah benar di file config!

## Understanding the Security Rules

### 🔒 User Data Protection

```json
"users": {
  "$uid": {
    ".read": "$uid === auth.uid",
    ".write": "$uid === auth.uid"
  }
}
```

**Artinya:**
- User hanya bisa read/write data mereka sendiri
- User A tidak bisa lihat atau ubah data User B
- Must be authenticated (`auth.uid`)

### 🔗 Connection Data

```json
"parent-child-connections": {
  ".read": "auth != null"
}
```

**Artinya:**
- Semua authenticated users bisa read connections
- Diperlukan untuk parent lihat child connections dan sebaliknya
- Write masih dibatasi (harus authenticated)

### 🔔 Notifications

```json
"notifications": {
  "$notificationId": {
    ".read": "auth.uid === data.child('toId').val() || auth.uid === data.child('fromId').val()",
    ".write": "auth.uid === newData.child('fromId').val() || auth.uid === data.child('toId').val()"
  }
}
```

**Artinya:**
- User hanya bisa read notifikasi yang ditujukan untuk mereka atau yang mereka kirim
- User hanya bisa write notifikasi dari diri mereka sendiri atau mark as read notifikasi untuk mereka
- Prevents notification spamming/snooping

### 🎯 Custom Buttons

```json
"parent-buttons": {
  "$buttonId": {
    ".write": "auth != null && (
      data.child('parentId').val() === auth.uid ||
      !data.exists()
    )"
  }
}
```

**Artinya:**
- Parent hanya bisa edit/delete buttons yang mereka buat
- Parent lain tidak bisa modify buttons
- Child bisa read tapi tidak bisa modify

### 🎫 Invite Codes

```json
"invite-codes": {
  ".read": "auth != null",
  "$inviteId": {
    ".write": "auth != null && (
      !data.exists() ||
      data.child('parentId').val() === auth.uid
    )"
  }
}
```

**Artinya:**
- Semua users bisa read invite codes (untuk validasi)
- Hanya parent yang buat invite code yang bisa modify/delete
- Child bisa read untuk connect, tapi tidak bisa modify

### 🔋 Child Status

```json
"child-status": {
  "$childId": {
    ".read": "auth != null",
    ".write": "$childId === auth.uid"
  }
}
```

**Artinya:**
- Semua authenticated users bisa read child status (parent perlu lihat battery level)
- Hanya child yang bersangkutan yang bisa update status mereka
- Prevents status spoofing

## Validation Rules

Setiap field memiliki validation untuk mencegah invalid data:

```json
"text": {
  ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
}
```

**Contoh validations:**
- `email`: Must be string
- `role`: Must be 'parent' or 'child'
- `batteryLevel`: Must be number 0-100
- `text`: Must be string, 1-100 characters
- `code`: Must be string, exactly 6 characters
- `read`: Must be boolean

## Testing Security Rules

### Test 1: User Can Only Access Their Own Data

```javascript
// Login as User A
const userA = await signInWithEmailAndPassword(auth, 'userA@test.com', 'password');

// Try to read User A's data ✅ Should succeed
const userAData = await get(ref(db, `users/${userA.uid}`));
console.log(userAData.exists()); // true

// Try to read User B's data ❌ Should fail (permission denied)
const userBData = await get(ref(db, `users/userB_uid`));
// Error: Permission denied
```

### Test 2: Authenticated Users Can Read Connections

```javascript
// Login as any user
const user = await signInWithEmailAndPassword(auth, 'test@test.com', 'password');

// Read connections ✅ Should succeed
const connections = await get(ref(db, 'parent-child-connections'));
console.log(connections.exists()); // true

// Try without authentication ❌ Should fail
await signOut(auth);
const connectionsUnauth = await get(ref(db, 'parent-child-connections'));
// Error: Permission denied
```

### Test 3: Notification Privacy

```javascript
// Login as Parent
const parent = await signInWithEmailAndPassword(auth, 'parent@test.com', 'password');

// Send notification to child ✅ Should succeed
await set(ref(db, `notifications/${notifId}`), {
  fromId: parent.uid,
  toId: child.uid,
  message: 'Test',
  // ...
});

// Login as different user
const otherUser = await signInWithEmailAndPassword(auth, 'other@test.com', 'password');

// Try to read notification ❌ Should fail (not sender or recipient)
const notif = await get(ref(db, `notifications/${notifId}`));
// Error: Permission denied
```

## Common Issues & Solutions

### Issue 1: Permission Denied on Read

**Error:**
```
Error: permission denied at /users/abc123
```

**Causes:**
1. User not authenticated
2. Trying to access another user's data
3. Rules not published

**Solution:**
```javascript
// Ensure user is logged in
if (!auth.currentUser) {
  await signInWithEmailAndPassword(auth, email, password);
}

// Only access your own data
const userRef = ref(db, `users/${auth.currentUser.uid}`);
```

### Issue 2: Permission Denied on Write

**Error:**
```
Error: permission denied at /parent-buttons/xyz789
```

**Causes:**
1. Trying to edit someone else's button
2. Not authenticated
3. Missing required fields in data

**Solution:**
```javascript
// Ensure parentId matches current user
const buttonData = {
  parentId: auth.currentUser.uid, // ✅ Must match auth.uid
  parentEmail: auth.currentUser.email,
  childEmail: child.email,
  text: 'Button text',
  // ... other required fields
};

await set(ref(db, `parent-buttons/${buttonId}`), buttonData);
```

### Issue 3: Validation Failed

**Error:**
```
Error: validation failed at /users/abc123
```

**Causes:**
1. Missing required fields
2. Wrong data type
3. Value out of range

**Solution:**
```javascript
// ❌ Wrong - missing fields
await set(ref(db, `users/${uid}`), {
  email: 'test@test.com'
  // Missing: name, role, createdAt
});

// ✅ Correct - all required fields
await set(ref(db, `users/${uid}`), {
  email: 'test@test.com',
  name: 'Test User',
  role: 'parent', // Must be 'parent' or 'child'
  phoneNumber: '+62123456789',
  createdAt: Date.now()
});
```

### Issue 4: Index Warning

**Warning in Console:**
```
Using an unspecified index. Consider adding ".indexOn": "childEmail"
```

**Solution:**
Rules sudah include `.indexOn`, tapi jika masih muncul:

1. Go to Firebase Console → Realtime Database → Tab "Rules"
2. Verify `.indexOn` ada di path yang dimaksud
3. Re-publish rules

## Database Structure Reference

```
aplikasiaac-4bbab-default-rtdb/
│
├── users/
│   └── {uid}/
│       ├── email: string
│       ├── name: string
│       ├── role: "parent" | "child"
│       ├── phoneNumber: string | null
│       └── createdAt: timestamp
│
├── parent-child-connections/
│   └── {connectionId}/
│       ├── parentId: string
│       ├── parentEmail: string
│       ├── parentName: string
│       ├── parentPhone: string | null
│       ├── childId: string
│       ├── childEmail: string
│       ├── childName: string
│       ├── status: "active" | "inactive" | "pending"
│       └── connectedAt: timestamp
│
├── parent-buttons/
│   └── {buttonId}/
│       ├── parentId: string
│       ├── parentEmail: string
│       ├── childId: string
│       ├── childEmail: string
│       ├── text: string (1-100 chars)
│       ├── audioFile: string | null
│       ├── audioBase64: string | null
│       └── createdAt: timestamp
│
├── notifications/
│   └── {notificationId}/
│       ├── fromId: string
│       ├── fromEmail: string
│       ├── fromName: string
│       ├── toId: string
│       ├── toEmail: string
│       ├── toName: string
│       ├── message: string
│       ├── type: string
│       ├── read: boolean
│       └── timestamp: timestamp
│
├── invite-codes/
│   └── {inviteId}/
│       ├── code: string (6 chars)
│       ├── parentId: string
│       ├── parentEmail: string
│       ├── parentName: string
│       ├── used: boolean
│       ├── usedBy: string | null
│       ├── usedAt: timestamp | null
│       ├── expiresAt: timestamp
│       └── createdAt: timestamp
│
├── child-status/
│   └── {childId}/
│       ├── childId: string
│       ├── childEmail: string
│       ├── batteryLevel: number (0-100)
│       ├── batteryState: number
│       ├── status: string
│       └── lastActive: timestamp
│
├── favorites/
│   └── {favoriteId}/
│       ├── childEmail: string
│       ├── message: string
│       └── createdAt: timestamp
│
└── analytics/ (optional)
    └── {eventId}/
        ├── eventName: string
        ├── eventData: object
        └── timestamp: timestamp
```

## Best Practices

### 1. Always Authenticate First

```javascript
// ❌ Bad
const data = await get(ref(db, 'users/123'));

// ✅ Good
if (!auth.currentUser) {
  await signInWithEmailAndPassword(auth, email, password);
}
const data = await get(ref(db, `users/${auth.currentUser.uid}`));
```

### 2. Include Required Fields

```javascript
// ❌ Bad - missing fields
await set(ref(db, path), { text: 'Button' });

// ✅ Good - all required fields
await set(ref(db, path), {
  parentId: auth.currentUser.uid,
  childEmail: child.email,
  text: 'Button',
  createdAt: Date.now()
});
```

### 3. Handle Permission Errors

```javascript
try {
  await set(ref(db, path), data);
} catch (error) {
  if (error.code === 'PERMISSION_DENIED') {
    console.error('You do not have permission to perform this action');
    // Show user-friendly message
  } else {
    console.error('Database error:', error);
  }
}
```

### 4. Use Transactions for Critical Updates

```javascript
import { runTransaction } from 'firebase/database';

// For operations that need to be atomic
await runTransaction(ref(db, `invite-codes/${inviteId}`), (current) => {
  if (current && !current.used) {
    current.used = true;
    current.usedBy = auth.currentUser.uid;
    current.usedAt = Date.now();
    return current;
  }
  return; // Abort if already used
});
```

## Monitoring & Maintenance

### View Database in Console

1. Go to Firebase Console → Realtime Database
2. Click "Data" tab
3. Browse data structure
4. Can manually edit/delete data (use carefully!)

### Monitor Usage

1. Firebase Console → Realtime Database → "Usage" tab
2. Check:
   - Connections (concurrent users)
   - Storage (database size)
   - Downloads (bandwidth)
   - Reads/Writes (operation count)

### Backup Data

```bash
# Export entire database
curl 'https://aplikasiaac-4bbab-default-rtdb.firebaseio.com/.json?auth=YOUR_SECRET' > backup.json

# Or use Firebase CLI
firebase database:get / --project aplikasiaac-4bbab > backup.json
```

### Restore Data

```bash
# Import data
firebase database:set / backup.json --project aplikasiaac-4bbab
```

## Summary

✅ **Setup Steps:**
1. Create Realtime Database in **Locked Mode**
2. Apply security rules from `firebase-database-rules.json`
3. Verify database URL in `firebaseConfig.js`
4. Test authentication and permissions

✅ **Security:**
- User data protected (read/write own data only)
- Notifications private (sender/recipient only)
- Buttons protected (creator can modify)
- All operations require authentication

✅ **Performance:**
- Indexes defined for common queries
- Validation prevents invalid data
- Efficient data structure

✅ **Ready to use!**

---

**Next Steps:**
1. Follow Step 1-2 to create database dan apply rules
2. Test dengan login/signup di aplikasi
3. Monitor usage di Firebase Console
