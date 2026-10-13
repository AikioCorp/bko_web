"use client";
import { FormEvent, useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

const labels: Record<string, string> = { PENDING: 'En attente', UNDER_REVIEW: 'En cours de vérification', APPROVED: 'Approuvée', REJECTED: 'Refusée' };
export default function StudioClaimsPage() {
  const [slug, setSlug] = useState('');
  const [proof, setProof] = useState('');
  const [claims, setClaims] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const load = async () => { const res = await fetchApi('/me/claims'); setClaims(res.data || []); };
  useEffect(() => { load().catch(err => setError(err.message)); }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      const identifier = slug.trim().split('/').filter(Boolean).pop() || '';
      const podcast = await fetchApi(`/podcasts/${encodeURIComponent(identifier)}`);
      if (!podcast.data?.id) throw new Error('Émission introuvable.');
      await fetchApi(`/podcasts/${podcast.data.id}/claims`, { method: 'POST',
        body: JSON.stringify({ proofDescription: proof.trim(), verificationMethod: 'MANUAL' }) });
      setSuccess('Demande envoyée. Votre propriété sera vérifiée avant tout accès à l’émission.');
      setSlug(''); setProof(''); await load();
    } catch (err: any) { setError(err.message); } finally { setBusy(false); }
  };
  return <div className="max-w-2xl mx-auto p-6 space-y-5">
    <h1 className="text-2xl font-bold">Revendiquer une émission</h1>
    <p className="text-gray-400">Votre émission existe déjà dans le catalogue ? Demandez à la gérer sans créer de doublon.</p>
    <form onSubmit={submit} className="space-y-4">
      <label className="block">Lien Bamako Podcast ou identifiant de l’émission
        <input required value={slug} onChange={e => setSlug(e.target.value)} className="block w-full p-3 bg-[#161616] border border-[#28282B] rounded-lg mt-2" /></label>
      <label className="block">Expliquez comment vérifier que cette émission vous appartient
        <textarea required minLength={10} value={proof} onChange={e => setProof(e.target.value)} className="block w-full p-3 bg-[#161616] border border-[#28282B] rounded-lg mt-2" /></label>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      {success && <p role="status">{success}</p>}
      <button disabled={busy} className="bg-[#FFBF00] text-black font-bold p-3 rounded-lg">{busy ? 'Envoi…' : 'Envoyer ma demande'}</button>
    </form>
    <h2 className="font-bold">Mes demandes</h2>
    {claims.length === 0 && <p className="text-gray-400">Aucune demande.</p>}
    {claims.map(claim => <div key={claim.id} className="border-t border-[#28282B] py-3">
      {claim.podcast?.name} · {labels[claim.status] || claim.status}
      {claim.reviewNotes && <p className="text-gray-400">{claim.reviewNotes}</p>}
    </div>)}
  </div>;
}
