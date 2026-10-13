"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';

export default function StudioImportRss() {
  const [podcasts, setPodcasts] = useState<Array<{id: string; name: string}>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true); setError('');
    fetchApi('/creator/podcasts').then(res => setPodcasts(res.data || []))
      .catch(err => setError(err.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);
  return <div className="max-w-2xl mx-auto p-6 space-y-5">
    <h1 className="text-2xl font-bold">Connecter un flux RSS</h1>
    <p className="text-gray-400">Choisissez l’émission à laquelle connecter le flux. L’analyse permet de vérifier son contenu avant l’importation.</p>
    {loading && <p>Chargement de vos émissions…</p>}
    {error && <div role="alert">{error}<button onClick={load} className="ml-3 text-[#FFBF00]">Réessayer</button></div>}
    {!loading && !error && podcasts.length === 0 && <p>Créez d’abord une émission en brouillon : elle accueillera les épisodes du flux RSS.</p>}
    {podcasts.map(podcast => <Link key={podcast.id} href={`/studio/podcasts/${podcast.id}/rss`}
      className="block p-4 border border-[#262626] rounded-xl hover:border-[#FFBF00]">{podcast.name} → Connecter le RSS</Link>)}
    <Link href="/studio/podcasts/new" className="inline-block text-[#FFBF00]">Créer une émission</Link>
  </div>;
}
