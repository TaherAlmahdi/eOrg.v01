import React from 'react';

interface Props {
  children: React.ReactNode;
  params: Promise<{ authorSlug: string }>;
}

export default async function AuthorLayout({ children, params }: Props) {
  const { authorSlug } = await params;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <main className="grow">{children}</main>
    </div>
  );
}