import { redirect } from 'next/navigation';

export default function SearchPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const q = searchParams.q || '';
  redirect(`/explore?q=${q}`);
}
