import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

export interface PromptPayQRResult {
  payload: string;
  qrDataUrl: string;
  amount: number;
  recipient: string;
  formattedRecipient: string;
}

/**
 * Generate a dynamic PromptPay QR code with exact decimal amount
 * @param amount Exact order amount in THB (e.g. 1450.00)
 * @param customRecipient Optional custom recipient phone or Tax ID
 */
export async function generateDynamicPromptPayQR(
  amount: number,
  customRecipient?: string
): Promise<PromptPayQRResult> {
  const recipient =
    customRecipient ||
    process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER ||
    "0819998888";

  // Clean phone/ID number (remove dashes, spaces)
  const cleanRecipient = recipient.replace(/[^0-9]/g, "");

  // Format recipient for display (e.g., 081-999-8888)
  let formattedRecipient = cleanRecipient;
  if (cleanRecipient.length === 10) {
    formattedRecipient = `${cleanRecipient.slice(0, 3)}-${cleanRecipient.slice(3, 6)}-${cleanRecipient.slice(6)}`;
  } else if (cleanRecipient.length === 13) {
    formattedRecipient = `${cleanRecipient.slice(0, 1)}-${cleanRecipient.slice(1, 5)}-${cleanRecipient.slice(5, 10)}-${cleanRecipient.slice(10, 12)}-${cleanRecipient.slice(12)}`;
  }

  // Ensure 2 decimal places precision for PromptPay EMVCo
  const normalizedAmount = Number(amount.toFixed(2));

  // Generate standard PromptPay EMVCo string
  const payload = generatePayload(cleanRecipient, { amount: normalizedAmount });

  // Generate QR Code as Base64 Data URL
  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
    color: {
      dark: "#0b1426",
      light: "#ffffff",
    },
  });

  return {
    payload,
    qrDataUrl,
    amount: normalizedAmount,
    recipient: cleanRecipient,
    formattedRecipient,
  };
}
