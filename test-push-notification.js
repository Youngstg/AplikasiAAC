import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import PushNotificationService from './services/PushNotificationService';
import RealTimeNotificationService from './services/RealTimeNotificationService';

export default function TestPushNotification() {
  const [isLoading, setIsLoading] = useState(false);
  const [pushToken, setPushToken] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Initializing push notification services...');
      
      // Initialize push notification service
      const pushInitialized = await PushNotificationService.initialize();
      console.log('Push service initialized:', pushInitialized);
      
      if (pushInitialized) {
        const token = PushNotificationService.getCurrentPushToken();
        setPushToken(token);
        
        // Initialize real-time service
        const realTimeInitialized = await RealTimeNotificationService.initialize();
        console.log('Real-time service initialized:', realTimeInitialized);
        
        const status = RealTimeNotificationService.getStatus();
        setServiceStatus(status);
        
        Alert.alert(
          '✅ Services Initialized',
          `Push notifications are ready!\nToken: ${token?.substring(0, 20)}...`
        );
      } else {
        Alert.alert('❌ Initialization Failed', 'Could not initialize push notifications');
      }
      
    } catch (error) {
      console.error('Error initializing services:', error);
      Alert.alert('❌ Error', `Failed to initialize: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addTestResult = (title, success, details) => {
    const result = {
      id: Date.now(),
      title,
      success,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const testLocalPushNotification = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing local push notification...');
      
      const success = await PushNotificationService.testPushNotification();
      
      if (success) {
        addTestResult('Local Push Test', true, 'Test notification sent successfully');
        Alert.alert('✅ Success', 'Test push notification sent!');
      } else {
        addTestResult('Local Push Test', false, 'Failed to send test notification');
        Alert.alert('❌ Failed', 'Could not send test notification');
      }
      
    } catch (error) {
      console.error('Error testing local push:', error);
      addTestResult('Local Push Test', false, `Error: ${error.message}`);
      Alert.alert('❌ Error', `Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testRealTimeNotification = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing real-time notification...');
      
      const triggerId = await RealTimeNotificationService.testRealTimeNotification();
      
      if (triggerId) {
        addTestResult('Real-time Test', true, `Trigger created: ${triggerId}`);
        Alert.alert('✅ Success', 'Real-time notification trigger created!');
      } else {
        addTestResult('Real-time Test', false, 'Failed to create notification trigger');
        Alert.alert('❌ Failed', 'Could not create notification trigger');
      }
      
    } catch (error) {
      console.error('Error testing real-time:', error);
      addTestResult('Real-time Test', false, `Error: ${error.message}`);
      Alert.alert('❌ Error', `Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testChildMessage = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing child message notification...');
      
      // Simulate sending message from child to parent
      const triggerId = await RealTimeNotificationService.notifyParentOfMessage(
        serviceStatus?.currentUserId,
        'Anna',
        'Halo mama, aku sudah selesai makan!'
      );
      
      if (triggerId) {
        addTestResult('Child Message Test', true, `Message trigger: ${triggerId}`);
        Alert.alert('✅ Success', 'Child message notification created!');
      } else {
        addTestResult('Child Message Test', false, 'Failed to create message notification');
        Alert.alert('❌ Failed', 'Could not create message notification');
      }
      
    } catch (error) {
      console.error('Error testing child message:', error);
      addTestResult('Child Message Test', false, `Error: ${error.message}`);
      Alert.alert('❌ Error', `Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testChildStatus = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing child status notification...');
      
      // Simulate child status update
      const triggerId = await RealTimeNotificationService.notifyParentOfStatus(
        serviceStatus?.currentUserId,
        'Anna',
        'sedang bermain dan belajar'
      );
      
      if (triggerId) {
        addTestResult('Child Status Test', true, `Status trigger: ${triggerId}`);
        Alert.alert('✅ Success', 'Child status notification created!');
      } else {
        addTestResult('Child Status Test', false, 'Failed to create status notification');
        Alert.alert('❌ Failed', 'Could not create status notification');
      }
      
    } catch (error) {
      console.error('Error testing child status:', error);
      addTestResult('Child Status Test', false, `Error: ${error.message}`);
      Alert.alert('❌ Error', `Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearBadgeCount = async () => {
    try {
      await PushNotificationService.clearBadgeCount();
      addTestResult('Clear Badge', true, 'Badge count cleared');
      Alert.alert('✅ Success', 'Badge count cleared!');
    } catch (error) {
      console.error('Error clearing badge:', error);
      addTestResult('Clear Badge', false, `Error: ${error.message}`);
    }
  };

  const refreshStatus = async () => {
    const status = RealTimeNotificationService.getStatus();
    setServiceStatus(status);
    const token = PushNotificationService.getCurrentPushToken();
    setPushToken(token);
    
    addTestResult('Refresh Status', true, 'Status refreshed');
  };

  const TestButton = ({ title, onPress, disabled, color = '#007AFF' }) => (
    <TouchableOpacity
      style={[styles.testButton, { backgroundColor: disabled ? '#ccc' : color }]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      <Text style={styles.testButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  const ResultItem = ({ result }) => (
    <View style={[styles.resultItem, { backgroundColor: result.success ? '#e8f5e8' : '#fee' }]}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>
          {result.success ? '✅' : '❌'} {result.title}
        </Text>
        <Text style={styles.resultTime}>{result.timestamp}</Text>
      </View>
      <Text style={styles.resultDetails}>{result.details}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔔 Push Notification Test</Text>
      
      {/* Service Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Service Status</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Push Token: {pushToken ? '✅ Ready' : '❌ Not Ready'}
          </Text>
          <Text style={styles.statusText}>
            Real-time Service: {serviceStatus?.isActive ? '✅ Active' : '❌ Inactive'}
          </Text>
          <Text style={styles.statusText}>
            User ID: {serviceStatus?.currentUserId || 'Not Set'}
          </Text>
          <Text style={styles.statusText}>
            Active Listeners: {serviceStatus?.activeListeners?.length || 0}
          </Text>
        </View>
        
        <TestButton
          title="🔄 Refresh Status"
          onPress={refreshStatus}
          color="#6c757d"
        />
      </View>

      {/* Test Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Test Functions</Text>
        
        <TestButton
          title="🔔 Test Local Push"
          onPress={testLocalPushNotification}
          disabled={!pushToken}
        />
        
        <TestButton
          title="⚡ Test Real-time Trigger"
          onPress={testRealTimeNotification}
          disabled={!serviceStatus?.isActive}
        />
        
        <TestButton
          title="💬 Test Child Message"
          onPress={testChildMessage}
          disabled={!serviceStatus?.isActive}
          color="#28a745"
        />
        
        <TestButton
          title="📱 Test Child Status"
          onPress={testChildStatus}
          disabled={!serviceStatus?.isActive}
          color="#17a2b8"
        />
        
        <TestButton
          title="🔢 Clear Badge Count"
          onPress={clearBadgeCount}
          color="#ffc107"
        />
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Testing...</Text>
        </View>
      )}

      {/* Test Results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Test Results</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No test results yet</Text>
        ) : (
          testResults.map(result => (
            <ResultItem key={result.id} result={result} />
          ))
        )}
      </View>

      {/* Debug Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🐛 Debug Info</Text>
        <Text style={styles.debugText}>
          Push Token: {pushToken ? `${pushToken.substring(0, 50)}...` : 'None'}
        </Text>
        <Text style={styles.debugText}>
          Listeners: {JSON.stringify(serviceStatus?.activeListeners || [])}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statusContainer: {
    marginBottom: 15,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
  resultDetails: {
    fontSize: 12,
    color: '#666',
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});