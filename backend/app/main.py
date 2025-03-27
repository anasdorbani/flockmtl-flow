from fastapi import FastAPI
from app.routers import pipeline

app = FastAPI()

# Include routers
app.include_router(pipeline.router)

@app.get("/")
async def root():
    return {"message": "FastAPI is running!"}
