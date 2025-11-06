import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { loadProspects } from '@/lib/csvLoader';

export default function AgenticDashboard() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load real CSV prospects on mount
  useEffect(() => {
    async function fetchProspects() {
      try {
        const rows = await loadProspects();
        setProspects(rows);
      } catch (err) {
        console.error("Failed loading CSV:", err);
      }
      setLoading(false);
    }
    fetchProspects();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-white mt-10">
        Loading real UCC leads…
      </div>
    );
  }

  if (prospects.length === 0) {
    return (
      <div className="text-center text-white mt-10">
        No leads found. Upload ucc_enriched.csv into /public.
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {prospects.map((p, i) => (
        <Card key={i} className="bg-slate-800 text-white border border-slate-700">
          <CardHeader>
            <CardTitle>{p.BusinessName || "Unknown Business"}</CardTitle>
            <CardDescription>
              {p.OwnerName || "Unknown Owner"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Phone:</strong> {p.Phone || "N/A"}</p>
            <p><strong>Email:</strong> {p.Email || "N/A"}</p>
            <p><strong>State:</strong> {p.State || "N/A"}</p>
            <p><strong>Revenue:</strong> {p.Revenue || "N/A"}</p>
            <p><strong>Filing Date:</strong> {p.FilingDate || "N/A"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

