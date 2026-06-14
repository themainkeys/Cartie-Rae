/**
 * Secure eBook Delivery & Expiration Validation Service
 * 
 * Provides production-ready structure to generate temporary expiring links for digital assets.
 * In a real backend, links are signed with JWT or HMAC tokens that contain expiration timestamps.
 */

import { SecureDownloadToken } from '../types';

export const ebookDeliveryService = {
  /**
   * Generates expiring secure link (default limit is 24 hours)
   */
  generateSecureLink(orderId: string, email: string, ebookId: string, durationHours = 24): SecureDownloadToken {
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
    
    // In production, signature would be generated on the backend using crypto.createHmac() or JWT signing keys:
    // const token = jwt.sign({ orderId, email, ebookId, exp: expiresAt }, process.env.JWT_SECRET);
    const mockSignature = btoa(JSON.stringify({ orderId, email, ebookId, expiresAt }));

    return {
      orderId,
      email,
      ebookId,
      expiresAt,
      token: mockSignature
    };
  },

  /**
   * Verifies if a given secure link has expired
   */
  verifyDownloadLink(token: string): { valid: boolean; orderId?: string; ebookId?: string; error?: string } {
    try {
      const decodedData = JSON.parse(atob(token)) as Omit<SecureDownloadToken, 'token'>;
      
      const isExpired = new Date() > new Date(decodedData.expiresAt);
      if (isExpired) {
        return {
          valid: false,
          error: 'The secure download link has expired (24-hour limit exceeded). Please contact support for renewal.'
        };
      }

      return {
        valid: true,
        orderId: decodedData.orderId,
        ebookId: decodedData.ebookId
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid digital delivery token signature.'
      };
    }
  },

  /**
   * Logs email notifications placeholder
   */
  sendConfirmationEmail(customerName: string, customerEmail: string, orderId: string, downloadLinks: SecureDownloadToken[]): void {
    console.log(`
=========================================
[SMTP EMAIL SIMULATOR] 
TO: ${customerEmail} (${customerName})
SUBJECT: Your Cartiae Rae eBook Download Keys (Order ${orderId})
=========================================
Hello ${customerName},

Thank you for your purchase! Your digital manuals have been compiled.
Please find your secure download links below. Note that for security reasons,
these links will expire 24 hours from receipt:

${downloadLinks.map(link => `- ${link.ebookId} Guide: ${window.location.origin}/download?token=${link.token}`).join('\n')}

If you have any questions or require support, please contact orders@cartiaerae.com.

Cartiae Rae Hair Education
=========================================
    `);
  }
};
