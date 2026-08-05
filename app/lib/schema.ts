// lib/schema.ts

export interface BookSchemaProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  authorName: string;
  authorUrl?: string;
  isbn?: string;
  genre?: string;
  datePublished?: string;
}

export function generateBookSchema({
  title,
  description,
  url,
  image,
  authorName,
  authorUrl,
  isbn,
  genre,
  datePublished,
}: BookSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    'name': title,
    'description': description,
    'url': url,
    ...(image && { 'image': image }),
    ...(isbn && { 'isbn': isbn }),
    ...(genre && { 'genre': genre }),
    ...(datePublished && { 'datePublished': datePublished }),
    'author': {
      '@type': 'Person',
      'name': authorName,
      ...(authorUrl && { 'url': authorUrl }),
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'এডুলিচার',
      'url': 'https://www.eduliture.org',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://www.eduliture.org/logo.png', // আপনার লোগোর ইউআরএল
      },
    },
    'inLanguage': 'bn', // ভাষা বাংলা নির্দেশ করতে
  };
}