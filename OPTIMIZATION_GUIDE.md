# Optimization Implementation Guide

Implementasi perbaikan #3 (Offline Support), #4 (Performance Optimization), dan #8 (Battery Optimization).

## 1. Offline Support

### Firebase Realtime Database Offline Persistence

**File: `firebaseConfig.js`**

Firebase Realtime Database **secara otomatis** mendukung offline persistence tanpa konfigurasi tambahan:

- Data yang dibaca akan di-cache secara lokal
- Operasi write akan di-queue dan di-sync saat online kembali
- Listener real-time tetap bekerja dengan data cached

**Keuntungan:**
- ✅ Aplikasi tetap berfungsi tanpa koneksi internet
- ✅ Data otomatis sync saat koneksi kembali
- ✅ Tidak perlu konfigurasi kompleks
- ✅ Gratis (Free tier Firebase)

### Offline Indicator

**File: `components/OfflineIndicator.js`**

Komponen yang menampilkan banner saat device offline.

**Features:**
- Mendeteksi status koneksi real-time menggunakan NetInfo
- Animasi smooth saat muncul/hilang
- Posisi fixed di atas layar
- Warna orange sebagai warning yang friendly

**Installation Required:**
```bash
npm install @react-native-community/netinfo
```

atau

```bash
npx expo install @react-native-community/netinfo
```

## 2. Performance Optimization

### React Hooks Optimization

**File: `app/child.js`**

#### useCallback
Mencegah re-creation function di setiap render:

```javascript
const handleCustomButtonPress = useCallback(async (button) => {
  // ... logic
}, [inputText]);

const sendNotification = useCallback(async (message) => {
  // ... logic
}, [currentUser]);

const handlePlayAudio = useCallback(async () => {
  // ... logic
}, [audioQueue, inputText, currentUser, sendNotification]);
```

**Manfaat:**
- Mengurangi re-render komponen child
- Stabilitas referensi function untuk dependencies
- Meningkatkan performa button press

#### useMemo
Mencegah re-computation pada setiap render:

```javascript
// Filter custom buttons hanya saat data berubah
const filteredCustomButtons = useMemo(() => {
  return customButtons.filter(btn => btn.childEmail === currentUser?.email);
}, [customButtons, currentUser?.email]);

// Calculate button style hanya saat screen size berubah
const getButtonStyle = useMemo(() => {
  const isLandscape = screenData.width > screenData.height;
  // ... calculations
  return { /* styles */ };
}, [screenData]);
```

**Manfaat:**
- Mengurangi filtering array yang berulang
- Mengurangi perhitungan style yang expensive
- Rendering lebih cepat dan smooth

### Error Handling & Loading States

**File: `app/child.js`**

```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const loadCustomButtons = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await getCustomButtons(currentUser.email);
    if (result.success) {
      setCustomButtons(result.data);
    } else {
      setError(result.error);
      // Show retry dialog
      Alert.alert(
        'Unable to Load Buttons',
        'Please check your connection and try again.',
        [
          { text: 'Retry', onPress: loadCustomButtons },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

**Manfaat:**
- User mendapat feedback yang jelas
- Kemampuan retry saat error
- Tidak ada silent failure

## 3. Battery Optimization

### Reduced Update Frequency

**File: `app/child.js`**

**Perubahan:**
- ❌ **Before**: Update setiap 30 detik
- ✅ **After**: Update setiap 5 menit (300,000ms)

**Threshold-based Updates:**
```javascript
const [lastBatteryLevel, setLastBatteryLevel] = useState(0);

const updateBattery = async () => {
  const batteryPercent = Math.round(level * 100);

  // Hanya update jika perubahan >= 5%
  if (Math.abs(lastBatteryLevel - batteryPercent) >= 5 || lastBatteryLevel === 0) {
    await updateChildStatus(currentUser.uid, {
      batteryLevel: batteryPercent,
      batteryState: state,
      status: 'active',
      lastActive: Date.now()
    });
    setLastBatteryLevel(batteryPercent);
  }
};
```

**Manfaat:**
- 🔋 **Hemat battery**: 90% pengurangan network requests (dari 120x/jam menjadi 12x/jam)
- 📡 **Hemat bandwidth**: Mengurangi data usage
- ⚡ **Akurat**: Update hanya saat ada perubahan signifikan (5%)
- 🔥 **Mengurangi Firebase usage**: Lebih sedikit write operations

### Battery Level Tracking

**Before:**
```
00:00 -> Update (100%)
00:00:30 -> Update (100%) ❌ Tidak perlu
00:01:00 -> Update (100%) ❌ Tidak perlu
00:01:30 -> Update (99%) ✅ Perlu
```

**After:**
```
00:00 -> Update (100%)
00:05:00 -> Skip (100% - no change >= 5%)
00:10:00 -> Skip (99% - change < 5%)
00:15:00 -> Update (95% - change >= 5%) ✅
```

## Testing

### Test Offline Support
1. Buka aplikasi dengan koneksi internet
2. Load data (buttons, connections, dll)
3. Matikan WiFi/Data
4. Coba akses fitur yang sudah di-load sebelumnya ✅ Harus berfungsi
5. Coba create button/notification ✅ Akan di-queue
6. Nyalakan kembali internet
7. Data akan otomatis sync ✅

### Test Performance
1. Buka React DevTools Profiler
2. Bandingkan render time sebelum/sesudah optimization
3. Test button press responsiveness
4. Check memory usage

### Test Battery
1. Monitor battery usage sebelum optimization (1 jam)
2. Monitor battery usage setelah optimization (1 jam)
3. Bandingkan penurunan battery percentage
4. Expected: ~1-2% improvement per hour

## Package Installation

Untuk menjalankan aplikasi dengan optimization ini, install package berikut:

```bash
# Offline detection
npx expo install @react-native-community/netinfo

# Verify existing packages
npm list @react-native-async-storage/async-storage
npm list expo-av
npm list expo-battery
```

## Monitoring & Analytics

Untuk memonitor efektivitas optimization:

1. **Firebase Console**
   - Realtime Database usage
   - Connection status
   - Read/Write operations count

2. **Device**
   - Battery usage per app (Settings > Battery)
   - Network usage (Settings > Network)

3. **Development**
   - React DevTools Profiler
   - Chrome DevTools Network tab
   - Firebase Debug Logging

## Troubleshooting

### Offline Indicator Tidak Muncul
- Pastikan `@react-native-community/netinfo` terinstall
- Check permission di AndroidManifest.xml: `ACCESS_NETWORK_STATE`
- Test dengan airplane mode

### Battery Masih Boros
- Verifikasi interval 300000ms (5 menit) bukan 30000ms
- Check tidak ada listener lain yang berjalan
- Pastikan cleanup useEffect berjalan dengan benar

### Data Tidak Sync Saat Online
- Check Firebase Realtime Database rules
- Verify internet connection
- Check Firebase console untuk error logs
- Enable Firebase debug logging: `enableLogging(true)`

## Best Practices

1. **Selalu handle offline state**
   - Show loading indicators
   - Provide retry mechanisms
   - Cache critical data locally

2. **Optimize re-renders**
   - Use useMemo untuk expensive calculations
   - Use useCallback untuk functions yang di-pass sebagai props
   - Avoid inline functions di render

3. **Battery conscious**
   - Batch updates saat possible
   - Gunakan threshold untuk mengurangi updates
   - Cleanup timers dan listeners di useEffect

4. **Monitor performa**
   - Regular profiling
   - Track battery usage
   - Monitor Firebase quota

## Next Steps

Setelah implementasi ini, consider:

1. ✅ Implemented: Offline support
2. ✅ Implemented: Performance optimization
3. ✅ Implemented: Battery optimization
4. 🔄 Future: Add analytics untuk track user behavior
5. 🔄 Future: Implement preloading untuk audio files
6. 🔄 Future: Add service worker untuk PWA support (jika deploy ke web)

---

**Note**: Semua optimization ini sudah terimplementasi di kode. Tinggal install dependency dan test!
