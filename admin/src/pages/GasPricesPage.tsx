import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const FUEL_TYPES = ['Diesel', 'Regular', 'Midgrade', 'Premium'] as const;
type FuelType = typeof FUEL_TYPES[number];
const ZONES = ['Calgary', 'Edmonton', 'Red Deer'];

type PriceEntry = { price: number; date: string } | null;

interface StationRow {
  id: string;
  name: string;
  address: string;
  zone: string;
  prices: Record<FuelType, PriceEntry>;
  latestDate: string | null;
}

async function fetchStations(): Promise<StationRow[]> {
  const { data: stations, error } = await supabase
    .from('gas_stations')
    .select('id, name, address, zone')
    .order('zone');
  if (error) throw error;

  const enriched = await Promise.all(
    (stations as { id: string; name: string; address: string; zone: string }[]).map(async (s) => {
      const { data: priceRows } = await supabase
        .from('gas_price_entries')
        .select('fuel_type, price_per_litre, date')
        .eq('station_id', s.id)
        .order('date', { ascending: false });

      const prices = Object.fromEntries(FUEL_TYPES.map((ft) => {
        const row = (priceRows ?? []).find((r: any) => r.fuel_type === ft);
        return [ft, row ? { price: row.price_per_litre, date: row.date } : null];
      })) as Record<FuelType, PriceEntry>;

      const latestDate = (priceRows ?? []).length > 0 ? (priceRows as any[])[0].date : null;

      return { ...s, prices, latestDate };
    })
  );
  return enriched;
}

type PriceFormState = Record<FuelType, string> & { date: string };

const emptyPriceForm = (): PriceFormState => ({
  Diesel: '', Regular: '', Midgrade: '', Premium: '',
  date: new Date().toISOString().split('T')[0],
});

export default function GasPricesPage() {
  const qc = useQueryClient();
  const [addingStation, setAddingStation] = useState(false);
  const [selectedStation, setSelectedStation] = useState<StationRow | null>(null);
  const [stationForm, setStationForm] = useState({ name: '', address: '', zone: 'Calgary' });
  const [priceForm, setPriceForm] = useState<PriceFormState>(emptyPriceForm());
  const [err, setErr] = useState('');

  const { data: stations = [], isLoading } = useQuery({ queryKey: ['gas-stations'], queryFn: fetchStations });

  const addStation = useMutation({
    mutationFn: async () => {
      if (!stationForm.name.trim() || !stationForm.address.trim()) throw new Error('Name and address are required.');
      const { error } = await supabase.from('gas_stations').insert({
        name: stationForm.name.trim(),
        address: stationForm.address.trim(),
        zone: stationForm.zone,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gas-stations'] });
      setAddingStation(false);
      setStationForm({ name: '', address: '', zone: 'Calgary' });
      setErr('');
    },
    onError: (e: Error) => setErr(e.message),
  });

  const savePrices = useMutation({
    mutationFn: async () => {
      if (!selectedStation) return;
      const { data: { session } } = await supabase.auth.getSession();
      const adminId = session?.user.id ?? 'admin';

      const rows = FUEL_TYPES
        .filter((ft) => priceForm[ft].trim() !== '')
        .map((ft) => {
          const price = parseFloat(priceForm[ft]);
          if (isNaN(price) || price <= 0) throw new Error(`Invalid price for ${ft}.`);
          return {
            station_id: selectedStation.id,
            fuel_type: ft,
            price_per_litre: price,
            date: priceForm.date,
            recorded_by: adminId,
          };
        });

      if (rows.length === 0) throw new Error('Enter at least one price.');
      const { error } = await supabase.from('gas_price_entries').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gas-stations'] });
      setSelectedStation(null);
      setPriceForm(emptyPriceForm());
      setErr('');
    },
    onError: (e: Error) => setErr(e.message),
  });

  function fmt(entry: PriceEntry) {
    if (!entry) return <span className="text-gray-600">—</span>;
    return <span className="text-white font-medium">${entry.price.toFixed(3)}</span>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-bold">Gas Prices</h1>
        <button
          onClick={() => setAddingStation(true)}
          className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Station
        </button>
      </div>

      {isLoading && <div className="text-gray-500 text-sm">Loading stations...</div>}

      <div className="bg-surface-raised border border-surface-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Station</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Zone</th>
              {FUEL_TYPES.map((ft) => (
                <th key={ft} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{ft}</th>
              ))}
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Updated</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((s) => (
              <tr key={s.id} className="border-b border-surface-border last:border-0 hover:bg-surface/50">
                <td className="px-4 py-3">
                  <div className="text-white">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.address}</div>
                </td>
                <td className="px-4 py-3 text-gray-400">{s.zone}</td>
                {FUEL_TYPES.map((ft) => (
                  <td key={ft} className="px-4 py-3">{fmt(s.prices[ft])}</td>
                ))}
                <td className="px-4 py-3 text-xs text-gray-500">{s.latestDate ?? '—'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => { setSelectedStation(s); setPriceForm(emptyPriceForm()); setErr(''); }}
                    className="text-xs text-brand hover:underline"
                  >
                    Update Prices
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {stations.length === 0 && !isLoading && (
          <div className="text-gray-500 text-sm px-4 py-6 text-center">No gas stations yet.</div>
        )}
      </div>

      {/* Add station modal */}
      {addingStation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 w-full max-w-sm">
            <div className="text-white font-semibold mb-4">Add Gas Station</div>
            <div className="space-y-4">
              {(['name', 'address'] as const).map((f) => (
                <div key={f}>
                  <label className="block text-xs text-gray-400 mb-1.5 capitalize">{f}</label>
                  <input
                    value={stationForm[f]}
                    onChange={(e) => setStationForm((s) => ({ ...s, [f]: e.target.value }))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Zone</label>
                <select
                  value={stationForm.zone}
                  onChange={(e) => setStationForm((s) => ({ ...s, zone: e.target.value }))}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
                >
                  {ZONES.map((z) => <option key={z}>{z}</option>)}
                </select>
              </div>
              {err && <div className="text-red-400 text-xs">{err}</div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => addStation.mutate()} disabled={addStation.isPending}
                className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors">
                {addStation.isPending ? 'Adding...' : 'Add'}
              </button>
              <button onClick={() => { setAddingStation(false); setErr(''); }}
                className="flex-1 bg-surface border border-surface-border text-gray-300 text-sm rounded-lg py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update prices modal */}
      {selectedStation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 w-full max-w-sm">
            <div className="text-white font-semibold mb-1">Update Prices</div>
            <div className="text-xs text-gray-500 mb-4">{selectedStation.name} · Leave blank to skip a fuel type</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Date</label>
                <input
                  type="date"
                  value={priceForm.date}
                  onChange={(e) => setPriceForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {FUEL_TYPES.map((ft) => (
                  <div key={ft}>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      {ft}
                      {selectedStation.prices[ft] && (
                        <span className="ml-1 text-gray-600">(was ${selectedStation.prices[ft]!.price.toFixed(3)})</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={priceForm[ft]}
                      onChange={(e) => setPriceForm((p) => ({ ...p, [ft]: e.target.value }))}
                      placeholder="1.599"
                      className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
                    />
                  </div>
                ))}
              </div>

              {err && <div className="text-red-400 text-xs">{err}</div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => savePrices.mutate()} disabled={savePrices.isPending}
                className="flex-1 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors">
                {savePrices.isPending ? 'Saving...' : 'Save Prices'}
              </button>
              <button onClick={() => { setSelectedStation(null); setErr(''); }}
                className="flex-1 bg-surface border border-surface-border text-gray-300 text-sm rounded-lg py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
