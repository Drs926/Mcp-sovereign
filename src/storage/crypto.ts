import * as SecureStore from 'expo-secure-store'
import CryptoJS from 'crypto-js'

const KEY_NAME = 'medtrackrapat_encryption_key'

export const ensureEncryptionKey = async (): Promise<string> => {
  const existing = await SecureStore.getItemAsync(KEY_NAME)
  if (existing != null) return existing

  const generated = CryptoJS.lib.WordArray.random(32).toString()
  await SecureStore.setItemAsync(KEY_NAME, generated)
  return generated
}

export const encryptString = async (plain: string): Promise<string> => {
  const key = await ensureEncryptionKey()
  return encryptWithKey(plain, key)
}

export const decryptString = async (cipherText: string): Promise<string> => {
  const key = await ensureEncryptionKey()
  return decryptWithKey(cipherText, key)
}

export const encryptWithKey = (plain: string, key: string): string => CryptoJS.AES.encrypt(plain, key).toString()

export const decryptWithKey = (cipherText: string, key: string): string => {
  const bytes = CryptoJS.AES.decrypt(cipherText, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export const rotateEncryptionKey = async (rewriter: (oldKey: string, newKey: string) => Promise<void>): Promise<void> => {
  const oldKey = await ensureEncryptionKey()
  const nextKey = CryptoJS.lib.WordArray.random(32).toString()
  await SecureStore.setItemAsync(`${KEY_NAME}_next`, nextKey)

  try {
    await rewriter(oldKey, nextKey)
    await SecureStore.setItemAsync(KEY_NAME, nextKey)
  } finally {
    await SecureStore.deleteItemAsync(`${KEY_NAME}_next`)
  }
}

export const hashCode = (code: string): string => CryptoJS.SHA256(code).toString()
