from fastapi import FastAPI, Request
from app.routers import router as api_router
from app.core.logger import logger
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"📥 {request.method} {request.url}")
    try:
        response = await call_next(request)
    except Exception as e:
        logger.exception(f"❌ Exception during request: {e}")
        raise
    logger.info(f"📤 {response.status_code} {request.url}")
    return response

app.include_router(api_router)

@app.get("/")
def read_root():
    logger.debug("Root endpoint called")
    return {"message": "Donate Raid API is running"}
