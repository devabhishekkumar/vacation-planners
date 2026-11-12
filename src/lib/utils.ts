export function getWhatsappUrl(message: string): string | null {
  return getWhatsappChatUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '', message);
}

export function matchesText(value: string, text: string): boolean {
  return value.toLocaleLowerCase().includes(text.trim().toLocaleLowerCase());
}

/** Require an international number; never guess the customer's country code. */
export function getWhatsappChatUrl(value: string, message: string): string | null {
  if (!/^\+?[\d ()-]+$/.test(value.trim())) return null;
  const phone = value.replace(/[ ()+-]/g, '');
  if (!/^[1-9]\d{9,14}$/.test(phone)) return null;
  return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
}
