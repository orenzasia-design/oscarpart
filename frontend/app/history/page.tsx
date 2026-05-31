'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('https://oscarpart-production.up.railway.app/api/v1/rfq/my', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setRfqs(data.data.rfqs || []);
        else console.error(data.error);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">History RFQ</h1>
      {rfqs.length === 0 ? (
        <p>Belum ada RFQ. <a href="/rfq" className="text-blue-600">Buat RFQ baru</a></p>
      ) : (
        <ul className="space-y-2">
          {rfqs.map((rfq: any) => (
            <li key={rfq.id} className="border p-3 rounded">
              <strong>{rfq.session_number}</strong> - Status: {rfq.status} - {new Date(rfq.created_at).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}