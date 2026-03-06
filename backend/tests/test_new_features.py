"""
Backend API Tests for RanchoPro - Iteration 2 (New Features)
Tests: Alerts (rule-based), NDVI satellite data, Offline sync, AI endpoint removal
"""
import pytest
import requests


class TestAlerts:
    """Rule-based alerts endpoint tests (NO AI, zero cost)"""
    
    def test_get_alerts_returns_list(self, base_url, api_client):
        """Test GET /api/alerts returns rule-based alerts"""
        response = api_client.get(f"{base_url}/api/alerts")
        print(f"GET /api/alerts: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "alerts" in data
        assert "count" in data
        assert isinstance(data["alerts"], list)
        
        print(f"✓ GET /api/alerts works - {data['count']} alerts found")
        
        # Check alert structure if any alerts exist
        if data["count"] > 0:
            alert = data["alerts"][0]
            assert "alert_id" in alert
            assert "type" in alert
            assert "severity" in alert
            assert "title" in alert
            assert "description" in alert
            
            # Check severity values
            assert alert["severity"] in ["alta", "media", "baja"]
            
            # Check alert types
            valid_types = [
                "vacunacion_pendiente",
                "parto_proximo", 
                "potrero_saturado",
                "pasto_deteriorado",
                "revision_pendiente"
            ]
            assert alert["type"] in valid_types
            
            print(f"✓ Alert structure validated - Type: {alert['type']}, Severity: {alert['severity']}")
    
    def test_alerts_rule_based_logic(self, base_url, api_client):
        """Verify alerts are rule-based (vaccination, calving, etc.)"""
        response = api_client.get(f"{base_url}/api/alerts")
        data = response.json()
        
        # Check for expected alert types based on seeded data
        alert_types = [a["type"] for a in data["alerts"]]
        
        print(f"✓ Alert types found: {set(alert_types)}")
        
        # Verify alerts have proper fields for rule-based logic
        for alert in data["alerts"]:
            if alert["type"] == "vacunacion_pendiente":
                assert "animal_id" in alert or "animal_name" in alert
            elif alert["type"] == "parto_proximo":
                assert "animal_id" in alert or "animal_name" in alert
            elif alert["type"] in ["potrero_saturado", "pasto_deteriorado"]:
                assert "paddock_id" in alert or "title" in alert
        
        print(f"✓ Rule-based alert logic validated")


class TestNDVI:
    """NDVI satellite data endpoint tests"""
    
    def test_get_ndvi_data(self, base_url, api_client):
        """Test GET /api/ndvi returns paddock health data"""
        response = api_client.get(f"{base_url}/api/ndvi")
        print(f"GET /api/ndvi: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "paddocks" in data
        assert "total" in data
        assert isinstance(data["paddocks"], list)
        
        print(f"✓ GET /api/ndvi works - {data['total']} paddocks")
    
    def test_ndvi_data_structure(self, base_url, api_client):
        """Verify NDVI data structure and values"""
        response = api_client.get(f"{base_url}/api/ndvi")
        data = response.json()
        
        if data["total"] > 0:
            paddock = data["paddocks"][0]
            
            # Check required fields
            required_fields = [
                "paddock_id", "name", "center_lat", "center_lng",
                "area_hectares", "grass_status", "ndvi_value",
                "animal_count", "capacity", "usage_percent",
                "recommendation"
            ]
            
            for field in required_fields:
                assert field in paddock, f"Missing field: {field}"
            
            # Validate NDVI value range
            ndvi = paddock["ndvi_value"]
            assert -1 <= ndvi <= 1, f"NDVI value out of range: {ndvi}"
            
            # Validate grass_status mapping
            assert paddock["grass_status"] in ["bueno", "regular", "malo"]
            
            # Check recommendation exists
            assert len(paddock["recommendation"]) > 0
            
            print(f"✓ NDVI data structure validated")
            print(f"  - Paddock: {paddock['name']}")
            print(f"  - NDVI: {ndvi}")
            print(f"  - Grass status: {paddock['grass_status']}")
            print(f"  - Recommendation: {paddock['recommendation']}")


class TestOfflineSync:
    """Offline sync endpoint tests"""
    
    def test_sync_empty_operations(self, base_url, api_client):
        """Test POST /api/sync with empty operations"""
        payload = {"operations": []}
        response = api_client.post(f"{base_url}/api/sync", json=payload)
        print(f"POST /api/sync (empty): {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "created" in data
        assert data["created"] == 0
        
        print(f"✓ Sync with empty operations works")
    
    def test_sync_create_animal_operation(self, base_url, api_client):
        """Test POST /api/sync creates animal from offline operation"""
        operations = [
            {
                "type": "create_animal",
                "data": {
                    "name": "TEST_SYNC_Animal",
                    "tag_id": "SYNC001",
                    "breed": "Holstein",
                    "animal_type": "vaca",
                    "sex": "hembra",
                    "status": "activo"
                }
            }
        ]
        
        response = api_client.post(f"{base_url}/api/sync", json={"operations": operations})
        print(f"POST /api/sync (create_animal): {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["created"] == 1
        assert "errors" in data
        
        print(f"✓ Sync create_animal operation works - {data['created']} created")
        
        # Verify animal was created
        animals_res = api_client.get(f"{base_url}/api/animals")
        animals = animals_res.json()
        sync_animals = [a for a in animals if a.get("name") == "TEST_SYNC_Animal"]
        assert len(sync_animals) > 0
        
        print(f"✓ Synced animal verified in database")
    
    def test_sync_multiple_operations(self, base_url, api_client):
        """Test POST /api/sync with multiple operation types"""
        operations = [
            {
                "type": "create_paddock",
                "data": {
                    "name": "TEST_SYNC_Potrero",
                    "area_hectares": 10,
                    "grass_status": "bueno",
                    "capacity": 15,
                    "status": "activo"
                }
            },
            {
                "type": "create_finance",
                "data": {
                    "transaction_type": "gasto",
                    "category": "veterinario",
                    "amount": 100000,
                    "description": "TEST_SYNC_Vacunación"
                }
            }
        ]
        
        response = api_client.post(f"{base_url}/api/sync", json={"operations": operations})
        print(f"POST /api/sync (multiple): {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["created"] == 2
        
        print(f"✓ Multiple sync operations work - {data['created']} created")


class TestAIEndpointRemoval:
    """Critical test: Verify AI endpoints have been removed (zero cost requirement)"""
    
    def test_ai_predict_endpoint_removed(self, base_url, api_client):
        """CRITICAL: Test /api/ai/predict endpoint returns 404 or 405 (should be removed)"""
        # Try POST to AI predict endpoint
        response = api_client.post(
            f"{base_url}/api/ai/predict",
            json={"prompt": "test"}
        )
        
        print(f"POST /api/ai/predict: {response.status_code}")
        
        # Should return 404 (Not Found) or 405 (Method Not Allowed)
        assert response.status_code in [404, 405], \
            f"CRITICAL: AI endpoint still exists! Status: {response.status_code}. AI should be completely disabled per requirements."
        
        print(f"✓ AI endpoint properly removed - returns {response.status_code}")
    
    def test_no_ai_endpoints_exist(self, base_url, api_client):
        """Verify no AI-related endpoints are accessible"""
        ai_endpoints = [
            "/api/ai/predict",
            "/api/ai/chat",
            "/api/ai/analyze",
            "/api/ai/recommendation"
        ]
        
        for endpoint in ai_endpoints:
            response = api_client.get(f"{base_url}{endpoint}")
            assert response.status_code in [404, 405], \
                f"AI endpoint {endpoint} should not exist but returned {response.status_code}"
        
        print(f"✓ All AI endpoints verified as removed")


class TestDashboardNoAI:
    """Verify dashboard returns data without AI fields"""
    
    def test_dashboard_no_ai_fields(self, base_url, api_client):
        """Test GET /api/dashboard does not include AI predictions"""
        response = api_client.get(f"{base_url}/api/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        
        # Ensure no AI-related fields exist
        ai_fields = ["ai_prediction", "ai_recommendation", "ai_insight", "ml_model"]
        for field in ai_fields:
            assert field not in data, f"Dashboard should not have AI field: {field}"
        
        print(f"✓ Dashboard has no AI fields")
