from fastapi import FastAPI, HTTPException
import pandas as pd

from grid import polygon_to_grid
from model import compute_fwi
from schemas import GridRequest, GridResponse

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Wildfire ML API is running"}


@app.post("/predict")
def predict(data: dict):
    # Convert incoming JSON into a Pandas DataFrame
    df = pd.DataFrame([data])

    # Run the ML model
    result = compute_fwi(df)

    # Return the prediction as JSON
    return result.to_dict(orient="records")[0]


@app.post("/grid", response_model=GridResponse)
def create_grid(request: GridRequest):
    """
    Generate grid points inside a user-drawn polygon.

    Uses the same bbox + degree-grid + point-in-polygon approach as chattisgarh.
    No FWI or prediction logic — grid creation only.
    """
    try:
        result = polygon_to_grid(
            polygon_coords=request.coordinates,
            grid_spacing=request.grid_spacing,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return GridResponse(**result)