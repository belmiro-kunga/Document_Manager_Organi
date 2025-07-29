"""
Advanced Document Management System - Python Analysis Service
Sistema de Gestão Documental Avançado - Serviço de Análise Python

This package provides OCR, NLP, and AI analysis capabilities for the Advanced DMS.
Este pacote fornece capacidades de OCR, NLP e análise de IA para o DMS Avançado.
"""

__version__ = "1.0.0"
__author__ = "Advanced DMS Team"
__email__ = "dev@adms.ao"

from .main import app
from .config import settings

__all__ = ["app", "settings"]