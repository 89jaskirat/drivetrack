/**
 * Supabase Edge Function: crawl-gas-prices
 *
 * Fetches current Calgary gas prices from GasBuddy's public web API
 * (the same API their website uses — no official key required for
 * reasonable usage, but check GasBuddy ToS for production/commercial use).
 *
 * Scheduled via Supabase Cron Jobs to run daily at 8:00 AM MST.
 *
 * SETUP:
 *   1. Deploy: `npx supabase functions deploy crawl-gas-prices`
 *   2. In Supabase Dashboard → Cron Jobs → create new job:
 *      Name: crawl-gas-prices-daily
 *      Schedule: 0 15 * * *   (8 AM MST = 15:00 UTC)
 *      Command: SELECT net.http_post(
 *                 url := 'https://<project>.supabase.co/functions/v1/crawl-gas-prices',
 *                 headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
 *               );
 *
 * ALTERNATIVE DATA SOURCE:
 *   Replace the fetchGasBuddyPrices() call with any source that returns
 *   { regular, midgrade, premium, diesel } prices for Calgary.
 *   Paid alternative: Google Places API (Fuel Prices) ~$17/1000 requests.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CALGARY_SEARCH = 'Calgary, AB, Canada';
const ZONE = 'Calgary';

// Fuel type mapping from GasBuddy product IDs to our DB values
const PRODUCT_MAP: Record<number, string> = {
  1: 'Regular',
  2: 'Midgrade',
  3: 'Premium',
  4: 'Diesel',
};

interface GasBuddyPrice {
  fuelType: string;
  price: number | null;
}

async function fetchGasBuddyPrices(): Promise<GasBuddyPrice[]> {
  // GasBuddy's public GraphQL endpoint (used by gasbuddy.com website)
  const query = `
    query LocationBySearchTerm($search: String!) {
      locationBySearchTerm(search: $search) {
        prices {
          results {
            name
            credit { price }
          }
        }
      }
    }
  `;

  const resp = await fetch('https://www.gasbuddy.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; DriveTrackBot/1.0)',
    },
    body: JSON.stringify({ operationName: 'LocationBySearchTerm', query, variables: { search: CALGARY_SEARCH } }),
  });

  if (!resp.ok) throw new Error(`GasBuddy fetch failed: ${resp.status}`);

  const json = await resp.json();
  const results = json?.data?.locationBySearchTerm?.prices?.results ?? [];

  // Map GasBuddy fuel names to our types
  const nameMap: Record<string, string> = {
    'Regular': 'Regular',
    'Midgrade': 'Midgrade',
    'Premium': 'Premium',
    'Diesel': 'Diesel',
    'ULP': 'Regular',       // Unleaded Petrol (some regions)
  };

  return results
    .map((r: any) => ({
      fuelType: nameMap[r.name] ?? null,
      // GasBuddy Canada prices are in cents/litre; convert to $/litre
      price: r.credit?.price != null ? r.credit.price / 100 : null,
    }))
    .filter((r: GasBuddyPrice) => r.fuelType !== null && r.price !== null);
}

Deno.serve(async (req) => {
  // Allow manual POST triggers and scheduled invocations
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const prices = await fetchGasBuddyPrices();

    if (prices.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'No prices returned from GasBuddy' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all stations in the Calgary zone
    const { data: stations, error: stErr } = await supabase
      .from('gas_stations')
      .select('id, name')
      .eq('zone', ZONE);

    if (stErr) throw stErr;
    if (!stations || stations.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'No Calgary stations in DB. Add stations first.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Insert one price entry per fuel type per station
    // (uses zone-average Calgary price from GasBuddy — per-station prices
    //  require GasBuddy's paid API or the Google Places API)
    const rows = stations.flatMap((station: { id: string; name: string }) =>
      prices.map((p) => ({
        station_id: station.id,
        fuel_type: p.fuelType,
        price_per_litre: p.price,
        date: today,
        recorded_by: null, // automated
      }))
    );

    // Upsert to avoid duplicates for same station+date+fuel_type
    const { error: insertErr } = await supabase
      .from('gas_price_entries')
      .upsert(rows, { ignoreDuplicates: true });

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ ok: true, stations: stations.length, prices: prices.length, rows: rows.length, date: today }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[crawl-gas-prices]', err?.message);
    return new Response(JSON.stringify({ ok: false, error: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
