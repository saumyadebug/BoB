import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Keyboard, Animated } from 'react-native';
import { Text, Button, Icon } from '@/components/ui';
import { COLORS, SHADOWS, RADIUS, SPACE, SIZES } from '@/constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { z } from 'zod';
import { useJoinGroup } from '@/hooks/useGroups';
import { isAppError } from '@/services/errors';

const CODE_LENGTH = 6;
const joinSchema = z.string().length(CODE_LENGTH).regex(/^[A-HJ-NP-Z2-9]+$/, "Invalid characters. Use A-Z, 2-9 (no 0, 1, I, O)");

export default function JoinGroupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const joinGroup = useJoinGroup();
  const [code, setCode] = useState(route.params?.code || '');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const inputRef = useRef<TextInput>(null);

  const handleJoin = async (codeToJoin = code) => {
    if (joinGroup.isPending) return;
    const result = joinSchema.safeParse(codeToJoin);
    if (result.success) {
      setError('');
      joinGroup.mutate(codeToJoin, {
        onSuccess: (group) => {
          navigation.replace('GroupHome', { groupId: group.id });
        },
        onError: (err) => {
          if (isAppError(err)) {
            switch (err.code) {
              case 'NOT_FOUND':
                setError('Invalid invite code.');
                break;
              case 'GROUP_FULL':
                setError('This pact is at capacity (max 6 members).');
                break;
              case 'ALREADY_MEMBER':
                setError('You are already a member of this pact.');
                break;
              default:
                setError(err.message);
            }
          } else {
            setError((err as Error).message || 'Failed to join group');
          }
        },
      });
    } else {
      setError(result.error.issues[0].message);
    }
  };

  const handleCodeChange = (text: string) => {
    const upperText = text.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '');
    setCode(upperText);
    setError('');
    
    if (upperText.length === CODE_LENGTH) {
      Keyboard.dismiss();
      setTimeout(() => handleJoin(upperText), 300);
    }
  };

  const handleBarcodeScanned = ({ data }: any) => {
    setIsScanning(false);
    // Assuming QR code contains deep link: streakpact://invite/CODE
    const match = data.match(/invite\/([A-Z2-9]{6})/i);
    if (match) {
      const scannedCode = match[1].toUpperCase();
      setCode(scannedCode);
      setTimeout(() => handleJoin(scannedCode), 500);
    } else {
      setError("Invalid QR Code format.");
    }
  };

  const renderSegmentedInput = () => {
    return (
      <View style={styles.segmentedContainer}>
        {[...Array(CODE_LENGTH)].map((_, i) => {
          const char = code[i] || '';
          const isActive = i === code.length;
          return (
            <View 
              key={i} 
              style={[
                styles.segmentSlot, 
                isActive && styles.segmentSlotActive,
                char ? styles.segmentSlotFilled : null
              ]}
            >
              <Text style={styles.segmentText}>{char}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (isScanning) {
    return (
      <View style={styles.container}>
        {!permission?.granted ? (
          <View style={styles.content}>
            <Text>No access to camera</Text>
            <Button label="Request Permission" onPress={requestPermission} style={{ marginTop: 20 }} />
            <Button label="Back" onPress={() => setIsScanning(false)} style={{ marginTop: 20 }} />
          </View>
        ) : (
          <CameraView 
            style={StyleSheet.absoluteFill} 
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerHeader}>
                <TouchableOpacity onPress={() => setIsScanning(false)}>
                  <Text style={styles.closeScannerText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.scannerTarget}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scannerHint}>Align QR code within the frame</Text>
            </View>
          </CameraView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text variant="headingMd">â† Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text variant="headingLg" style={styles.title}>Join a Pact</Text>
        <Text style={styles.subtitle}>Enter the 6-character invite code below.</Text>
        
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => inputRef.current?.focus()}
          style={styles.inputWrapper}
        >
          {renderSegmentedInput()}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={handleCodeChange}
            maxLength={CODE_LENGTH}
            autoCapitalize="characters"
            keyboardType="default"
            autoCorrect={false}
            autoComplete="off"
            autoFocus
          />
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={styles.qrButton} 
          onPress={() => setIsScanning(true)}
        >
          <View style={styles.qrButtonInner}>
            <Text style={styles.qrEmoji}>ðŸ“·</Text>
            <Text style={styles.qrText}>Scan QR Code</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button
          label={joinGroup.isPending ? 'Joining...' : 'Join Pact'}
          onPress={() => handleJoin(code)}
          disabled={joinGroup.isPending || code.length < CODE_LENGTH}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SIZES.padding,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  segmentedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segmentSlot: {
    width: 48,
    height: 56,
    backgroundColor: COLORS.bgBase,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)', // Inset look
  },
  segmentSlotActive: {
    borderColor: COLORS.accentBlue,
  },
  segmentSlotFilled: {
    backgroundColor: COLORS.bgBase,
    borderColor: 'transparent',
    ...SHADOWS.softElevation,
  },
  segmentText: {
    fontSize: 24,
    fontFamily: 'RobotoMono-Bold',
    color: COLORS.textPrimary,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.bgBase,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  qrButton: {
    alignSelf: 'center',
    width: '100%',
  },
  qrButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgBase,
    paddingVertical: 16,
    borderRadius: SIZES.radiusButton,
    ...SHADOWS.softElevation,
  },
  qrEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  qrText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  footer: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerHeader: {
    position: 'absolute',
    top: 60,
    left: 24,
  },
  closeScannerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scannerTarget: {
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.accentBlue,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  scannerHint: {
    color: 'white',
    marginTop: 40,
    fontSize: 16,
  }
});
