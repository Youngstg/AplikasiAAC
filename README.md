# AplikasiAAC - AAC Mobile Application

AplikasiAAC adalah aplikasi mobile React Native yang dirancang untuk komunikasi augmentatif dan alternatif (AAC) dengan fitur autentikasi berbasis peran untuk Parent dan Child.

## Fitur Utama

### 🔐 Autentikasi Firebase
- **Login** dengan email dan password
- **Sign Up** dengan role-based registration
- **Forgot Password** dengan reset email
- **Role-based routing** (Parent/Child)

### 👨‍👩‍👧‍👦 Role-Based System
- **Parent**: Akses ke dashboard manajemen dengan nomor telepon wajib
- **Child**: Akses ke komunikasi board yang user-friendly

### 📱 Parent Dashboard
- Child management
- Communication settings
- Progress reports
- Emergency contacts

### 🎮 Child Dashboard
- Interactive communication buttons
- Quick actions
- User-friendly interface dengan emoji

## Tech Stack

- **React Native** dengan Expo
- **Expo Router** untuk navigation
- **Firebase Authentication** untuk autentikasi
- **Firestore** untuk database
- **AsyncStorage** untuk local storage

## Struktur Project

```
AplikasiAAC/
├── app/
│   ├── _layout.js          # Root layout dengan navigation
│   ├── index.js            # Loading screen & route handler
│   ├── login.js            # Login screen
│   ├── signup.js           # Sign up screen
│   ├── forgot-password.js  # Reset password screen
│   ├── parent.js           # Parent dashboard
│   └── child.js            # Child dashboard
├── contexts/
│   └── AuthContext.js      # Authentication context
├── firebaseConfig.js       # Firebase configuration
├── app.json               # Expo configuration
└── package.json           # Dependencies
```

## Setup & Installation

### 1. Clone Repository
```bash
git clone [repository-url]
cd AplikasiAAC
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Setup
1. Buat project baru di [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication dengan Email/Password
3. Buat Firestore Database
4. Copy configuration ke `firebaseConfig.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Run Application
```bash
# Development
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## Firestore Database Structure

```javascript
// Collection: users
{
  uid: {
    email: "user@example.com",
    name: "User Name",
    role: "parent" | "child",
    phoneNumber: "1234567890", // hanya untuk parent
    createdAt: "2024-01-01T00:00:00.000Z"
  }
}
```

## Authentication Flow

1. **App Launch**: Check authentication state
2. **Not Authenticated**: Redirect to Login
3. **Authenticated**: Check user role
4. **Role-based Routing**:
   - Parent → Parent Dashboard
   - Child → Child Dashboard

## Sign Up Process

### Parent Account
- Email (required)
- Name (required)
- Password (required)
- Confirm Password (required)
- Phone Number (required)
- Role: Parent

### Child Account
- Email (required)
- Name (required)
- Password (required)
- Confirm Password (required)
- Role: Child

## Features Implementation

### Parent Dashboard
- 📊 Child management interface
- ⚙️ Communication settings
- 📈 Progress reports
- 🚨 Emergency contacts setup

### Child Dashboard
- 🎯 8 communication buttons dengan emoji
- 💧 Basic needs (water, food, help)
- 😊 Emotions (happy, sad, tired)
- 🎮 Activities (play, thank you)
- 📞 Quick actions (call parent, repeat, favorites)

## Development Notes

- Menggunakan **Expo Router** untuk navigation
- **Authentication Context** untuk state management
- **Firebase Auth** untuk user authentication
- **Firestore** untuk user data storage
- **React Native** best practices

## Deployment

1. Build untuk production:
```bash
eas build --platform android
eas build --platform ios
```

2. Submit ke stores:
```bash
eas submit --platform android
eas submit --platform ios
```

## Security Features

- Firebase Authentication rules
- Role-based access control
- Secure password requirements (min 6 characters)
- Email verification untuk password reset

## Future Enhancements

- Text-to-speech integration
- Custom communication boards
- Progress tracking
- Parent-child communication sync
- Offline mode support
- Multiple language support

## Support

Untuk pertanyaan atau masalah, silakan hubungi tim development atau buat issue di repository ini.