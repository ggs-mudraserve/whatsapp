/**
 * Phone number utility functions for normalizing input to E.164 format
 * as required by the WhatsApp Cloud API
 */

/**
 * Validates if a phone number is in proper E.164 format
 */
export function isValidE164(phoneNumber: string): boolean {
  // E.164 format: +[country code][number] (7-15 digits after +)
  return /^\+[1-9]\d{7,14}$/.test(phoneNumber)
}

/**
 * Normalizes a phone number to E.164 format
 * Handles both 10-digit local numbers and E.164 numbers
 * 
 * @param phoneNumber - Input phone number (10-digit or E.164)
 * @param defaultCountryCode - Default country code to use for 10-digit numbers (default: '91' for India)
 * @returns Normalized E.164 phone number or null if invalid
 */
export function normalizeToE164(phoneNumber: string, defaultCountryCode: string = '91'): string | null {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '')
  
  // If already starts with +, validate and return
  if (cleaned.startsWith('+')) {
    return isValidE164(cleaned) ? cleaned : null
  }
  
  // Handle 10-digit local numbers
  if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
    const e164 = `+${defaultCountryCode}${cleaned}`
    return isValidE164(e164) ? e164 : null
  }
  
  // Handle numbers that start with country code but no +
  if (cleaned.length > 10) {
    const withPlus = `+${cleaned}`
    return isValidE164(withPlus) ? withPlus : null
  }
  
  return null
}

/**
 * Formats a phone number for display purposes
 * Converts E.164 to a more readable format
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  if (!isValidE164(phoneNumber)) {
    return phoneNumber
  }
  
  // For Indian numbers (+91XXXXXXXXXX), format as +91 XXXXX XXXXX
  if (phoneNumber.startsWith('+91') && phoneNumber.length === 13) {
    const number = phoneNumber.slice(3)
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`
  }
  
  // For US/Canada (+1XXXXXXXXXX), format as +1 (XXX) XXX-XXXX
  if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
    const number = phoneNumber.slice(2)
    return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
  }
  
  // For other numbers, just add space after country code
  const match = phoneNumber.match(/^(\+\d{1,3})(\d+)$/)
  if (match) {
    return `${match[1]} ${match[2]}`
  }
  
  return phoneNumber
}

/**
 * Validates phone number input and returns validation result
 */
export interface PhoneValidationResult {
  isValid: boolean
  normalizedE164?: string
  error?: string
}

export function validatePhoneInput(phoneNumber: string, defaultCountryCode: string = '91'): PhoneValidationResult {
  if (!phoneNumber.trim()) {
    return {
      isValid: false,
      error: 'Phone number is required'
    }
  }
  
  const normalized = normalizeToE164(phoneNumber, defaultCountryCode)
  
  if (!normalized) {
    return {
      isValid: false,
      error: 'Invalid phone number format. Use 10-digit number or E.164 format (+1234567890)'
    }
  }
  
  return {
    isValid: true,
    normalizedE164: normalized
  }
} 