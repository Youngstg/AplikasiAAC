# 🔔 Sistem Notifikasi Pop-up untuk Aplikasi AAC

## 📱 Fitur Notifikasi

Aplikasi sekarang mendukung notifikasi pop-up seperti WhatsApp yang akan muncul bahkan saat aplikasi lain sedang terbuka.

### ✅ Yang Sudah Diimplementasikan:

1. **Local Notifications** - Kompatibel dengan Expo Go
2. **Background Polling** - Deteksi pesan baru saat app di background
3. **App State Listener** - Otomatis check saat app kembali aktif
4. **Badge Count** - Menampilkan jumlah notifikasi di icon app
5. **Real-time Detection** - Langsung kirim notifikasi saat ada pesan baru

## 🚀 Cara Kerja:

### 1. **Saat App Aktif (Foreground)**
- Firebase real-time listener mendeteksi pesan baru
- Notifikasi local langsung muncul
- Badge count terupdate otomatis

### 2. **Saat App di Background**
- Background task polling Firebase setiap 15 detik
- Jika ada pesan baru, kirim notifikasi local
- Saat app dibuka kembali, check missed notifications

### 3. **Saat App Ditutup**
- Background task tetap berjalan (terbatas)
- Notifikasi muncul saat sistem mengizinkan

## 🔧 Komponen Utama:

### `NotificationService.js`
- Mengelola local notifications
- App state listener
- Badge count management
- Missed notification detection

### `BackgroundNotificationService.js`
- Background task registration
- Firebase polling saat app di background
- Task manager untuk expo-background-fetch

## 📋 Permissions yang Diperlukan:

```json
{
  "android": {
    "permissions": [
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "WAKE_LOCK",
      "SYSTEM_ALERT_WINDOW"
    ]
  }
}
```

## 💡 Cara Testing:

1. **Jalankan aplikasi:**
   ```bash
   npm run start
   ```

2. **Test notifikasi:**
   - Buka halaman parent
   - Buka aplikasi lain
   - Dari perangkat anak, tekan tombol untuk kirim pesan
   - Notifikasi akan muncul di perangkat parent

3. **Test background:**
   - Minimize aplikasi parent
   - Tunggu 15-30 detik
   - Kirim pesan dari anak
   - Notifikasi akan muncul

## 🎯 Perbedaan dengan Push Notifications:

| Fitur | Push Notifications | Local Notifications |
|-------|-------------------|-------------------|
| Kompatibilitas | Perlu development build | ✅ Bekerja dengan Expo Go |
| Saat app ditutup | ✅ Selalu bekerja | ⚠️ Terbatas pada background tasks |
| Setup complexity | Tinggi | Rendah |
| Battery usage | Rendah | Sedang |

## 🔄 Alur Notifikasi:

```
Anak tekan tombol → Firebase → Real-time listener → Local notification → Pop-up muncul
```

## ⚙️ Konfigurasi:

Di `app/parent.js`, sistem otomatis:
1. Register local notifications
2. Setup background polling
3. Monitor app state changes
4. Handle missed notifications

## 📝 Logs untuk Debugging:

- `✅ Local notifications enabled` - Sistem berhasil init
- `Background task running...` - Background polling aktif
- `Checking for missed notifications...` - App state change detection
- `Notification received:` - Notifikasi berhasil diterima

## 🛠️ Troubleshooting:

### Notifikasi tidak muncul?
1. Pastikan permissions granted
2. Check console logs
3. Test dengan perangkat fisik (bukan simulator)
4. Restart aplikasi

### Background task tidak berjalan?
1. Background fetch mungkin dibatasi sistem
2. Periksa battery optimization settings
3. Test dengan interval yang lebih lama

## 🎉 Hasil Akhir:

Sistem notifikasi yang bekerja seperti WhatsApp dengan:
- Pop-up notification saat app lain terbuka
- Sound & vibration
- Badge count di icon
- Real-time detection pesan baru
- Background polling untuk missed messages

**Catatan:** Sistem ini dioptimalkan untuk Expo Go dan akan bekerja lebih baik lagi dengan development build yang memiliki akses penuh ke push notifications.