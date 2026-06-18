"""
EcoPilot Backend — Pydantic models for API request/response validation.
(Optional: only needed if running the standalone FastAPI backend)
"""
from pydantic import BaseModel
from typing import Optional


class LifestyleProfile(BaseModel):
    commute_mode: str = "bus"
    commute_km_per_day: float = 10.0
    flights_domestic_per_year: int = 0
    flights_international_per_year: int = 0
    car_fuel_type: Optional[str] = None
    diet_type: str = "veg"
    eating_out_per_week: int = 2
    electricity_kwh_per_month: float = 150.0
    lpg_cylinders_per_month: float = 0.5
    ac_hours_per_day: float = 2.0
    renewable_percent: float = 0.0
    new_clothes_per_year: int = 10
    electronics_per_year: int = 1


class FootprintBreakdown(BaseModel):
    transport: float
    diet: float
    energy: float
    shopping: float
    total: float
    trees_equivalent: int
    car_km_equivalent: int


class SimulateRequest(BaseModel):
    what_if_text: str
    current_profile: LifestyleProfile


class SimulateResponse(BaseModel):
    delta_kg_annual: float
    percent_change: float
    new_total: float
    explanation: str
    breakdown: FootprintBreakdown
