'use client';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { getWhatsappUrl } from '@/lib/utils';
export default function WhatsAppButton() {
  const href = getWhatsappUrl('Hello Vacation Planners! I would like to plan a holiday.');
  if (!href) return null;
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Chat with Vacation Planners on WhatsApp"
    >
      <MessageCircle size={24} />
    </Link>
  );
}
