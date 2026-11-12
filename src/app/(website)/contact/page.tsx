import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Clock3, MapPin, MessageCircle } from 'lucide-react';
import EnquiryForm from '@/components/EnquiryForm';
import PageHero from '@/components/PageHero';
import { getSiteContent } from '@/lib/content/service';
import { getWhatsappUrl } from '@/lib/utils';
export const metadata: Metadata = {
  title: 'Contact & Enquiries',
  description: 'Tell Vacation Planners about your dream getaway or a custom holiday enquiry.',
};
export default function ContactPage() {
  const { photos } = getSiteContent();

  const wa = getWhatsappUrl('Hello Vacation Planners, I would like to discuss a holiday.');
  return (
    <>
      <PageHero
        eyebrow="LET'S START A CONVERSATION"
        title="A great journey starts with hello."
        description="Tell us a little about your dream getaway. We can't wait to hear where you're headed."
        image={photos.bali}
        crumb="Contact"
      />
      <section className="section">
        <div className="container contact-grid">
          <div className="contact-copy">
            <span className="eyebrow">GET IN TOUCH</span>
            <h2>
              Let's create something <em>wonderful together.</em>
            </h2>
            <p>
              Planning a honeymoon, family escape, bucket-list adventure or a quick break? Share a
              little about your plans.
            </p>
            <div className="contact-method">
              <span>
                <MapPin size={22} />
              </span>
              <div>
                <h3>Visit our office</h3>
                <p>
                  A14, 10th Main Road,
                  <br />
                  Jayanagar 3rd Block
                </p>
                <Link
                  href="https://www.google.com/maps/search/?api=1&query=A14%2C%2010th%20Main%20Road%2C%20Jayanagar%203rd%20Block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Find us on the map <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
            <div className="contact-method">
              <span>
                <MessageCircle size={22} />
              </span>
              <div>
                <h3>Chat with our team</h3>
                {wa ? (
                  <Link href={wa} target="_blank" rel="noopener noreferrer">
                    Open WhatsApp <ArrowUpRight size={15} />
                  </Link>
                ) : (
                  <p>WhatsApp contact will be available once the business number is added.</p>
                )}
              </div>
            </div>
            <div className="contact-method">
              <span>
                <Clock3 size={22} />
              </span>
              <div>
                <h3>Have a question?</h3>
                <p>
                  Send your trip requirements using the form. Working contact details and opening
                  hours will be added after confirmation.
                </p>
              </div>
            </div>
            <div className="contact-photo">
              <span>WHERE TO NEXT?</span>
            </div>
          </div>
          <div className="form-shell contact-form-shell">
            <span className="eyebrow">SEND AN ENQUIRY</span>
            <h2>Tell us about your trip.</h2>
            <p>Send your travel requirements and our team will get in touch.</p>
            <EnquiryForm />
          </div>
        </div>
      </section>
    </>
  );
}
