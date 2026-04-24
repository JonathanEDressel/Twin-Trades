import * as LocalAuthentication from 'expo-local-authentication';

export async function canUseBiometrics(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function authenticateWithBiometrics(reason: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Use Password',
    disableDeviceFallback: false,
  });
  return result.success;
}
