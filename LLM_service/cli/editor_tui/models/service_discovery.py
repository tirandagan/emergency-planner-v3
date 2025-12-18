"""
Service Discovery - Scan and introspect available workflow services

Dynamically discovers services from app.workflows.services and extracts
their metadata for use in the editor UI.
"""

import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

# Add app directory to path for imports
app_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(app_dir))


@dataclass
class ServiceOperation:
    """Metadata for a single service operation."""
    name: str
    required_params: List[str]
    optional_params: List[str]
    param_descriptions: Dict[str, str]


@dataclass
class ServiceInfo:
    """Metadata for an available service."""
    service_name: str
    display_name: str
    operations: List[ServiceOperation]
    description: str


class ServiceDiscovery:
    """
    Discovers and introspects available workflow services.

    Scans app/workflows/services/ directory and imports service classes
    to extract their metadata for editor UI.
    """

    def __init__(self):
        self._services: Dict[str, ServiceInfo] = {}
        self._discover_services()

    def _discover_services(self) -> None:
        """Scan and import all available services."""
        try:
            # Import service classes
            from app.workflows.services import GooglePlacesService, WeatherAPIService

            # Register Google Places
            self._register_google_places()

            # Register WeatherAPI
            self._register_weatherapi()

        except ImportError as e:
            # Services not available - editor will show empty list
            print(f"Warning: Could not import services: {e}")

    def _register_google_places(self) -> None:
        """Register Google Places service metadata."""
        self._services["google_places"] = ServiceInfo(
            service_name="google_places",
            display_name="Google Places",
            description="Search for places, get place details",
            operations=[
                ServiceOperation(
                    name="nearby_search",
                    required_params=["location", "radius"],
                    optional_params=["type", "keyword", "name", "language"],
                    param_descriptions={
                        "location": "Coordinates as 'lat,lng' (e.g., '40.7128,-74.0060')",
                        "radius": "Search radius in meters (max: 50000)",
                        "type": "Place type (e.g., 'hospital', 'restaurant')",
                        "keyword": "Text to match against place names",
                        "name": "Place name to search for",
                        "language": "Language code for results"
                    }
                ),
                ServiceOperation(
                    name="text_search",
                    required_params=["query"],
                    optional_params=["location", "radius", "type", "language"],
                    param_descriptions={
                        "query": "Text query (e.g., 'hospitals in New York')",
                        "location": "Coordinates as 'lat,lng' to bias results",
                        "radius": "Search radius in meters (requires location)",
                        "type": "Place type filter",
                        "language": "Language code for results"
                    }
                ),
                ServiceOperation(
                    name="place_details",
                    required_params=["place_id"],
                    optional_params=["fields", "language"],
                    param_descriptions={
                        "place_id": "Google Place ID",
                        "fields": "Comma-separated list of fields to return",
                        "language": "Language code for results"
                    }
                )
            ]
        )

    def _register_weatherapi(self) -> None:
        """Register WeatherAPI service metadata."""
        self._services["weatherapi"] = ServiceInfo(
            service_name="weatherapi",
            display_name="WeatherAPI",
            description="Current weather conditions",
            operations=[
                ServiceOperation(
                    name="current",
                    required_params=["q"],
                    optional_params=["aqi", "lang"],
                    param_descriptions={
                        "q": "Location query (lat,lng or city name)",
                        "aqi": "Include air quality data (yes/no)",
                        "lang": "Language code for condition text"
                    }
                )
            ]
        )

    def get_all_services(self) -> List[ServiceInfo]:
        """Get list of all available services."""
        return list(self._services.values())

    def get_service(self, service_name: str) -> Optional[ServiceInfo]:
        """Get metadata for a specific service."""
        return self._services.get(service_name)

    def get_service_names(self) -> List[str]:
        """Get list of service identifiers."""
        return list(self._services.keys())

    def get_operations(self, service_name: str) -> List[str]:
        """Get list of operation names for a service."""
        service = self._services.get(service_name)
        if service:
            return [op.name for op in service.operations]
        return []

    def get_operation(
        self,
        service_name: str,
        operation_name: str
    ) -> Optional[ServiceOperation]:
        """Get metadata for a specific operation."""
        service = self._services.get(service_name)
        if service:
            for op in service.operations:
                if op.name == operation_name:
                    return op
        return None


# Global service discovery instance
service_discovery = ServiceDiscovery()
