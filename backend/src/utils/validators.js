// VPA Validation
function validateVPA(vpa) {
    if (!vpa || typeof vpa !== 'string') {
        return false;
    }
    const vpaPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    return vpaPattern.test(vpa);
}

// Luhn Algorithm for card validation
function validateCardNumber(cardNumber) {
    if (!cardNumber) return false;
    
    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    // Check if only digits and length between 13-19
    if (!/^\d{13,19}$/.test(cleaned)) {
        return false;
    }
    
    // Apply Luhn algorithm
    let sum = 0;
    let isEven = false;
    
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
function detectCardNetwork(cardNumber) {
    if (!cardNumber) return 'unknown';
    
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    // Visa: starts with 4
    if (cleaned.startsWith('4')) {
        return 'visa';
    }
    
    // Mastercard: starts with 51-55
    if (/^5[1-5]/.test(cleaned)) {
        return 'mastercard';
    }
    
    // Amex: starts with 34 or 37
    if (cleaned.startsWith('34') || cleaned.startsWith('37')) {
        return 'amex';
    }
    
    // RuPay: starts with 60, 65, or 81-89
    if (cleaned.startsWith('60') || cleaned.startsWith('65') || /^8[1-9]/.test(cleaned)) {
        return 'rupay';
    }
    
    return 'unknown';
}

// Expiry Date Validation
function validateExpiry(month, year) {
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10);
    
    // Validate month
    if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
        return false;
    }
    
    // Parse year (support both 2-digit and 4-digit formats)
    let fullYear;
    if (year.length === 2) {
        fullYear = 2000 + expYear;
    } else if (year.length === 4) {
        fullYear = expYear;
    } else {
        return false;
    }
    
    // Compare with current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (fullYear > currentYear) {
        return true;
    } else if (fullYear === currentYear) {
        return expMonth >= currentMonth;
    } else {
        return false;
    }
}

module.exports = {
    validateVPA,
    validateCardNumber,
    detectCardNetwork,
    validateExpiry
};
