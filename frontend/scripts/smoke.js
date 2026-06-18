(async () => {
  const base = process.env.SMOKE_BASE || (process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3000');
  const headers = { 'Content-Type': 'application/json' };

  const profile = {
    commute_mode: 'bus',
    commute_km_per_day: 10,
    flights_domestic_per_year: 1,
    flights_international_per_year: 0,
    car_fuel_type: null,
    diet_type: 'veg',
    eating_out_per_week: 2,
    electricity_kwh_per_month: 150,
    lpg_cylinders_per_month: 0.5,
    ac_hours_per_day: 2,
    renewable_percent: 0,
    new_clothes_per_year: 5,
    electronics_per_year: 1
  };

  try {
    const fpRes = await fetch(`${base}/api/footprint`, {
      method: 'POST', headers, body: JSON.stringify(profile)
    });
    const fpJson = await fpRes.json();
    console.log('--- /api/footprint ---');
    console.log(JSON.stringify(fpJson, null, 2));

    const simulateBody = { what_if_text: 'switch to metro and go vegan', current_profile: profile };
    const simRes = await fetch(`${base}/api/simulate`, {
      method: 'POST', headers, body: JSON.stringify(simulateBody)
    });
    const simJson = await simRes.json();
    console.log('--- /api/simulate ---');
    console.log(JSON.stringify(simJson, null, 2));

    const coachBody = { profile, breakdown: fpJson };
    const coachRes = await fetch(`${base}/api/coach`, {
      method: 'POST', headers, body: JSON.stringify(coachBody)
    });
    const coachJson = await coachRes.json();
    console.log('--- /api/coach ---');
    console.log(JSON.stringify(coachJson, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exit(1);
  }
})();
