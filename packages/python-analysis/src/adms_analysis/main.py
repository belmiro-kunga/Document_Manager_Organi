"""
FastAPI application entry point for Python Analysis Service
Ponto de entrada da aplicação FastAPI para o Serviço de Análise Python
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from .config import settings
from .routers import ocr, nlp, ai

# Create FastAPI application
app = FastAPI(
    title="Advanced DMS - Python Analysis Service",
    description="OCR, NLP, and AI analysis service for Advanced Document Management System",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Add security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ocr.router, prefix="/api/v1/ocr", tags=["OCR"])
app.include_router(nlp.router, prefix="/api/v1/nlp", tags=["NLP"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Advanced DMS - Python Analysis Service",
        "version": "1.0.0",
        "status": "running",
        "supported_languages": ["pt-PT", "en-US", "fr-FR"],
        "capabilities": ["OCR", "NLP", "AI Analysis"]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "python-analysis"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )