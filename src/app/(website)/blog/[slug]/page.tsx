import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { getSiteContent } from '@/lib/content/service';
export async function generateStaticParams() {
  const { articleCards } = await getSiteContent();
  return articleCards.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}): Promise<Metadata> {
  const { articleCards } = await getSiteContent();
  const { slug } = await params;
  const a = articleCards.find((a) => a.slug === slug);
  return { title: a?.title ?? 'Article not found', description: a?.excerpt };
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { articleCards } = await getSiteContent();
  const { slug } = await params;
  const article = articleCards.find((a) => a.slug === slug);
  if (!article) notFound();
  return (
    <article>
      <div className="container article-top">
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <ChevronRight size={14} />
          <Link href="/blog">Travel journal</Link>
          <ChevronRight size={14} />
          <span>{article.category}</span>
        </div>
        <span className="eyebrow">
          {article.category} · {article.read}
        </span>
        <h1>{article.title}</h1>
        <p>{article.excerpt}</p>
      </div>
      <div className="container article-cover">
        <Image
          src={article.image}
          alt={article.title}
          fill
          priority
          sizes="100vw"
          className="image-cover"
        />
      </div>
      <div className="article-copy">
        <p className="article-editor-note">
          Travel journal sample content — review information and destination requirements before
          publication.
        </p>
        {article.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <div className="article-end">
          <Link href="/blog" className="text-link">
            <ArrowLeft size={17} /> Back to the journal
          </Link>
          <Link href="/contact" className="btn btn-dark">
            Plan your journey <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}
