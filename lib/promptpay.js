function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Generates the EMVCo PromptPay QR Code payload.
 * @param {string} target - The PromptPay ID (Mobile phone number starting with 0, or 13-digit National/Tax ID)
 * @param {number|string} [amount] - Optional payment amount
 * @returns {string} The final EMVCo string payload to be encoded into a QR code
 */
export function generatePromptPayPayload(target, amount) {
  // Remove non-numeric characters
  const cleanTarget = target.replace(/[^0-9]/g, '');
  
  let targetType = '';
  let formattedTarget = '';
  
  if (cleanTarget.length === 10 || (cleanTarget.length === 9 && !cleanTarget.startsWith('0'))) {
    // Mobile Number
    targetType = '01';
    const mobile = cleanTarget.startsWith('0') ? cleanTarget.substring(1) : cleanTarget;
    formattedTarget = `0066${mobile}`.padStart(13, '0');
  } else if (cleanTarget.length === 13) {
    // National ID / Tax ID
    targetType = '02';
    formattedTarget = cleanTarget;
  } else {
    // Default fallback
    targetType = cleanTarget.length > 10 ? '02' : '01';
    formattedTarget = cleanTarget;
  }

  // Merchant Account Information (Tag 29)
  // Sub-tag 00: Application ID (A000000677010111)
  // Sub-tag 01/02: PromptPay Number (01 for Mobile, 02 for National ID)
  const merchantInfo = 
    '0016A000000677010111' + 
    targetType + 
    String(formattedTarget.length).padStart(2, '0') + 
    formattedTarget;
  
  let payload = '000201'; // Payload Format Indicator
  payload += amount ? '010212' : '010211'; // Point of Initiation Method: 12 (dynamic/amount) or 11 (static)
  payload += '29' + String(merchantInfo.length).padStart(2, '0') + merchantInfo;
  payload += '5303764'; // Transaction Currency THB (764)
  
  if (amount && parseFloat(amount) > 0) {
    const amountStr = Number(amount).toFixed(2);
    payload += '54' + String(amountStr.length).padStart(2, '0') + amountStr;
  }
  
  payload += '5802TH'; // Country Code TH
  payload += '6304'; // Checksum identifier and length
  
  const checksum = crc16(payload);
  return payload + checksum;
}
