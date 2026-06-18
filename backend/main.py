"""
EcoPilot Backend — Optional standalone FastAPI server.

For the MVP, all logic runs inside Next.js API routes.
This file is provided as a reference for future Python backend migration.

Run: uvicorn main:app --reload --port 8000
"""
import re
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from constants import EMISSION_FACTORS
from models import (
    LifestyleProfile,
    FootprintBreakdown,
    SimulateRequest,
    SimulateResponse,
)

app = FastAPI(title="EcoPilot API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def calculate_footprint(profile: LifestyleProfile) -> FootprintBreakdown:
    EF = EMISSION_FACTORS

    # Transport
    if profile.commute_mode == "car":
        key = f"car_{profile.car_fuel_type or 'petrol'}"
        factor = EF.get(key, EF["car_petrol"])
    else:
        factor = EF.get(profile.commute_mode, EF["bus"])
    
    # Commuting year standardized to 240 days
    commute = profile.commute_km_per_day * 240 * factor
    
    # Split domestic vs international flights
    domestic_flights = (profile.flights_domestic_per_year or 0) * EF["flight_domestic"]
    intl_flights = (profile.flights_international_per_year or 0) * EF["flight_international"]
    transport = commute + domestic_flights + intl_flights

    # Diet
    daily = EF.get(profile.diet_type, EF["veg"])
    diet = daily * 365 + profile.eating_out_per_week * 52 * 1.2

    # Energy: Prevent double-counting AC electricity
    ac_electricity = profile.ac_hours_per_day * 365 * 1.5  # in kWh
    total_electricity = profile.electricity_kwh_per_month * 12
    non_ac_electricity = max(0.0, total_electricity - ac_electricity)

    renewable_factor = 1 - profile.renewable_percent / 100
    elec_emissions = (non_ac_electricity * renewable_factor) * EF["electricity_kwh"]
    ac_emissions = ac_electricity * renewable_factor * EF["electricity_kwh"]
    
    lpg = profile.lpg_cylinders_per_month * 12 * 14.2 * EF["lpg_kg"]
    energy = elec_emissions + lpg + ac_emissions

    # Shopping
    shopping = (
        profile.new_clothes_per_year * EF["clothing_item"]
        + profile.electronics_per_year * EF["electronics_item"]
    )

    total = transport + diet + energy + shopping

    return FootprintBreakdown(
        transport=round(transport, 1),
        diet=round(diet, 1),
        energy=round(energy, 1),
        shopping=round(shopping, 1),
        total=round(total, 1),
        trees_equivalent=round(total / 21),
        car_km_equivalent=round(total / EF["car_petrol"]),
    )


def parse_what_if(text: str) -> dict:
    lower = text.lower()
    changes = {}

    if re.search(r"metro|train|subway", lower):
        changes["commute_mode"] = "metro"
        changes["car_fuel_type"] = None
    elif re.search(r"bus|public transport", lower):
        changes["commute_mode"] = "bus"
        changes["car_fuel_type"] = None
    elif re.search(r"bike|cycle|bicycle", lower):
        changes["commute_mode"] = "bike"
        changes["car_fuel_type"] = None
    elif re.search(r"work from home|wfh|remote", lower):
        changes["commute_mode"] = "wfh"
    elif re.search(r"electric car|ev|electric vehicle", lower):
        changes["commute_mode"] = "car"
        changes["car_fuel_type"] = "electric"

    if re.search(r"no flights?|stop flying|zero flights?", lower):
        changes["flights_domestic_per_year"] = 0
        changes["flights_international_per_year"] = 0

    if re.search(r"vegan", lower):
        changes["diet_type"] = "vegan"
    elif re.search(r"vegetarian|veg\\b", lower):
        changes["diet_type"] = "veg"

    if re.search(r"solar|renewable|green energy", lower):
        changes["renewable_percent"] = 100

    if re.search(r"no ac|without ac|stop ac", lower):
        changes["ac_hours_per_day"] = 0

    return changes


@app.post("/api/footprint", response_model=FootprintBreakdown)
async def footprint_endpoint(profile: LifestyleProfile):
    return calculate_footprint(profile)


@app.post("/api/simulate", response_model=SimulateResponse)
async def simulate_endpoint(req: SimulateRequest):
    changes = parse_what_if(req.what_if_text)
    original = calculate_footprint(req.current_profile)

    modified = req.current_profile.model_copy(update=changes)
    updated = calculate_footprint(modified)

    delta = updated.total - original.total
    pct = (delta / original.total) * 100 if original.total else 0

    descs = []
    if "commute_mode" in changes:
        descs.append(f"commute → {changes['commute_mode']}")
    if "diet_type" in changes:
        descs.append(f"diet → {changes['diet_type']}")
    if "renewable_percent" in changes:
        descs.append(f"{changes['renewable_percent']}% renewable")
    action = ", ".join(descs) if descs else "the change"

    trees = abs(round(delta / 21))
    if delta < 0:
        expl = f"With {action}, you'd save {abs(round(delta))} kg CO₂e/year — like planting {trees} trees! 🌱"
    elif delta > 0:
        expl = f"With {action}, your footprint would increase by {round(abs(delta))} kg CO₂e/year."
    else:
        expl = "No significant change detected. Try a different scenario!"

    return SimulateResponse(
        delta_kg_annual=round(delta, 1),
        percent_change=round(pct, 1),
        new_total=updated.total,
        explanation=expl,
        breakdown=updated,
    )


@app.get("/")
async def health():
    return {"status": "ok", "app": "EcoPilot API", "version": "1.0.0"}
