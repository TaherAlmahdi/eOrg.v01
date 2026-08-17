// app/lib/books.ts
export * from './books/types';
export * from './books/utils';
export * from './books/hierarchy';
export * from './books/fetchers';

// Toc বা অন্যান্য রিকানেকশন (যদি থেকে থাকে)
export { getBookDirectoryBySlug as getBookDirectoryBySlugFromToc } from './books/toc';