import { useEffect, useState } from 'react';
import {
    BatchOperations
} from '@/components/BatchOperations';
import {
    SortControls,
    SortField,
    SortDirection
} from '@/components/SortControls';
import {
    ProspectCard
} from '@/components/ProspectCard';
import {
    AdvancedFilters
} from '@/components/AdvancedFilters';
import {
    ExportProspects,
    ExportFormat
} from '@/lib/exportUtils';

import { loadProspects } from '@/lib/csvLoader';

import {
    Target,
    ChartBar,
    Heart,
    Bookmark
} from 'phosphor-icons/react';
import { toast } from 'sonner';

export default function App() {
    const [prospects, setProspects] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [sortField, setSortField] = useState<SortField>('priorityScore');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // ✅ LOAD REAL CSV DATA
    useEffect(() => {
        async function fetchData() {
            try {
                const rows = await loadProspects();
                setProspects(rows);
                setFiltered(rows);
            } catch (err) {
                console.error('Failed loading CSV:', err);
                toast.error('Error loading UCC data.');
            }
        }
        fetchData();
    }, []);

    // ✅ SORTING
    useEffect(() => {
        let sorted = [...filtered];
        sorted.sort((a, b) => {
            const aa = Number(a[sortField] ?? 0);
            const bb = Number(b[sortField] ?? 0);
            if (sortDirection === 'asc') return aa - bb;
            return bb - aa;
        });
        setFiltered(sorted);
    }, [sortField, sortDirection]);

    return (
        <div className="app-container">
            <AdvancedFilters
                prospects={prospects}
                onFilter={setFiltered}
            />

            <SortControls
                sortField={sortField}
                sortDirection={sortDirection}
                onFieldChange={setSortField}
                onDirectionChange={setSortDirection}
            />

            <BatchOperations prospects={filtered} />

            <div className="prospect-grid">
                {filtered.map((p, i) => (
                    <ProspectCard key={i} prospect={p} />
                ))}
            </div>

            <ExportProspects
                prospects={filtered}
                format={ExportFormat.CSV}
            />
        </div>
    );
}

