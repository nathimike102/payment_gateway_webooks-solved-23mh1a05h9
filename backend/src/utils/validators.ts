// VPA Validation
export function validateVPA(vpa: string): boolean {
  const vpaPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return vpaPattern.test(vpa);
}

// Luhn Algorithm for Card Validation
export function validateCardNumber(cardNumber: string): boolean {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  // Check if it contains only digits and has valid length
  if (!/^\d+$/.test(cleaned) || cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
  // Apply Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  // Start from the rightmost digit
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Card Network Detection
export function detectCardNetwork(cardNumber: string): string {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  // Check first digits
  if (cleaned.startsWith('4')) {
    return 'visa';
  }
  
  const first2 = cleaned.substring(0, 2);
  const first2Num = parseInt(first2, 10);
  
  if (first2Num >= 51 && first2Num <= 55) {
    return 'mastercard';
  }
  
  if (first2 === '34' || first2 === '37') {
    return 'amex';
  }
  
  if (first2 === '60' || first2 === '65' || (first2Num >= 81 && first2Num <= 89)) {
    return 'rupay';
  }
  
  return 'unknown';
}

// Card Expiry Validation
export function validateCardExpiry(month: string, year: string): boolean {
  const monthNum = parseInt(month, 10);
  
  // Validate month
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return false;
  }
  
  // Parse year
  let yearNum = parseInt(year, 10);
  
  // Convert 2-digit year to 4-digit
  if (year.length === 2) {
    yearNum = 2000 + yearNum;
  } else if (year.length !== 4) {
    return false;
  }
  
  // Get current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Check if expiry is in the future or current month
  if (yearNum > currentYear) {
    return true;
  } else if (yearNum === currentYear && monthNum >= currentMonth) {
    return true;
  }
  
  return false;
}

// Get last 4 digits of card
export function getCardLast4(cardNumber: string): string {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  return cleaned.slice(-4);
}
