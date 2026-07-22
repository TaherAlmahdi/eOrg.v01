import React from 'react';

interface Props {
  children: React.ReactNode;
  params: Promise<Record<string, string | undefined>>;
}

export default async function AuthorLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <main className="grow">{children}</main>
    </div>
  );
}