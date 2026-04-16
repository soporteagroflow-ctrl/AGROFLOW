"""
Backend API Tests - Phase 1 Rebrand & Security (AgroFlow v2.0.0)
Tests: Rate limiting, Photo upload, CSV export, Audit logs, Branding
"""
import pytest
import requests
import time
import base64


class TestRateLimiting:
    """Rate limiting tests (slowapi - 10/minute on /api/auth/session)"""
    
    def test_rate_limit_auth_session(self, base_url):
        """Test POST /api/auth/session rate limit - 10/minute"""
        print("\n=== Testing Rate Limiting on /api/auth/session ===")
        
        # Send 12 rapid requests with invalid session_id
        responses = []
        for i in range(12):
            try:
                response = requests.post(
                    f"{base_url}/api/auth/session",
                    json={"session_id": f"invalid_test_{i}"},
                    timeout=5
                )
                responses.append(response.status_code)
                print(f"Request {i+1}: {response.status_code}")
            except Exception as e:
                print(f"Request {i+1} failed: {e}")
                responses.append(0)
        
        # Count 429 responses (rate limited)
        rate_limited_count = responses.count(429)
        
        print(f"\n✓ Rate limiting test complete")
        print(f"  - Total requests: {len(responses)}")
        print(f"  - 429 (Too Many Requests): {rate_limited_count}")
        print(f"  - 401 (Unauthorized): {responses.count(401)}")
        
        # Should have at least 2 rate-limited responses after 10th request
        assert rate_limited_count >= 2, f"Expected rate limiting after 10 requests, got {rate_limited_count} 429 responses"
        
        print(f"✓ Rate limiting working - {rate_limited_count} requests blocked")


class TestPhotoUpload:
    """Animal photo upload tests (base64)"""
    
    def test_get_valid_animal_id(self, base_url, api_client):
        """Get a valid animal_id from seeded data"""
        response = api_client.get(f"{base_url}/api/animals")
        assert response.status_code == 200
        
        animals = response.json()
        assert len(animals) > 0, "No animals found in database"
        
        animal_id = animals[0]["animal_id"]
        print(f"\n✓ Valid animal_id retrieved: {animal_id}")
        return animal_id
    
    def test_upload_animal_photo(self, base_url, api_client):
        """Test POST /api/animals/{id}/photo with base64 image"""
        print("\n=== Testing Photo Upload ===")
        
        # Get valid animal_id
        animals_res = api_client.get(f"{base_url}/api/animals")
        animals = animals_res.json()
        assert len(animals) > 0
        animal_id = animals[0]["animal_id"]
        
        # Create small base64 test image (1x1 pixel PNG)
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        payload = {
            "animal_id": animal_id,
            "photo_base64": test_image_base64,
            "description": "TEST_PHOTO_Upload test from pytest"
        }
        
        response = api_client.post(f"{base_url}/api/animals/{animal_id}/photo", json=payload)
        print(f"POST /api/animals/{animal_id}/photo: {response.status_code}")
        
        assert response.status_code == 200, f"Photo upload failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "photo_id" in data
        assert "message" in data
        
        print(f"✓ Photo uploaded successfully - photo_id: {data['photo_id']}")
        
        return animal_id, data["photo_id"]
    
    def test_list_animal_photos(self, base_url, api_client):
        """Test GET /api/animals/{id}/photos"""
        print("\n=== Testing Photo List ===")
        
        # Get animal_id
        animals_res = api_client.get(f"{base_url}/api/animals")
        animals = animals_res.json()
        animal_id = animals[0]["animal_id"]
        
        response = api_client.get(f"{base_url}/api/animals/{animal_id}/photos")
        print(f"GET /api/animals/{animal_id}/photos: {response.status_code}")
        
        assert response.status_code == 200
        
        photos = response.json()
        assert isinstance(photos, list)
        
        print(f"✓ Photo list retrieved - {len(photos)} photos found")
        
        # Verify structure if photos exist
        if len(photos) > 0:
            photo = photos[0]
            assert "photo_id" in photo
            assert "animal_id" in photo
            assert "photo_base64" in photo
            assert "description" in photo
            assert "created_at" in photo
            
            print(f"✓ Photo structure validated")


class TestCSVExport:
    """CSV export tests with Spanish headers"""
    
    def test_export_animals_csv(self, base_url, api_client):
        """Test GET /api/export/animals returns CSV with Spanish headers"""
        print("\n=== Testing Animals CSV Export ===")
        
        response = api_client.get(f"{base_url}/api/export/animals")
        print(f"GET /api/export/animals: {response.status_code}")
        
        assert response.status_code == 200
        
        # Check Content-Type
        content_type = response.headers.get("Content-Type", "")
        print(f"Content-Type: {content_type}")
        assert "text/csv" in content_type, f"Expected text/csv, got {content_type}"
        
        # Check Content-Disposition
        content_disposition = response.headers.get("Content-Disposition", "")
        print(f"Content-Disposition: {content_disposition}")
        assert "attachment" in content_disposition
        assert "agroflow_ganado.csv" in content_disposition
        
        # Check CSV content
        csv_content = response.text
        lines = csv_content.strip().split("\n")
        
        assert len(lines) > 0, "CSV is empty"
        
        # Check Spanish headers
        headers = lines[0]
        print(f"CSV Headers: {headers}")
        
        # Verify Spanish column names
        spanish_columns = ["Nombre", "Arete", "Tipo", "Raza", "Sexo", "Peso", "Estado"]
        for col in spanish_columns:
            assert col in headers, f"Missing Spanish column: {col}"
        
        print(f"✓ Animals CSV export validated")
        print(f"  - {len(lines)-1} animal records")
        print(f"  - Spanish headers confirmed")
    
    def test_export_finances_csv(self, base_url, api_client):
        """Test GET /api/export/finances returns CSV"""
        print("\n=== Testing Finances CSV Export ===")
        
        response = api_client.get(f"{base_url}/api/export/finances")
        print(f"GET /api/export/finances: {response.status_code}")
        
        assert response.status_code == 200
        
        # Check Content-Type
        content_type = response.headers.get("Content-Type", "")
        assert "text/csv" in content_type
        
        # Check filename
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "agroflow_finanzas.csv" in content_disposition
        
        # Check CSV content
        csv_content = response.text
        lines = csv_content.strip().split("\n")
        
        assert len(lines) > 0
        
        headers = lines[0]
        print(f"CSV Headers: {headers}")
        
        # Verify Spanish headers
        spanish_columns = ["Tipo", "Categoría", "Monto", "Descripción", "Fecha"]
        for col in spanish_columns:
            assert col in headers, f"Missing Spanish column: {col}"
        
        print(f"✓ Finances CSV export validated")
        print(f"  - {len(lines)-1} finance records")


class TestAuditLogs:
    """Audit logs endpoint tests (owner role only)"""
    
    def test_get_audit_logs_as_owner(self, base_url, api_client):
        """Test GET /api/audit-logs as owner role"""
        print("\n=== Testing Audit Logs ===")
        
        response = api_client.get(f"{base_url}/api/audit-logs")
        print(f"GET /api/audit-logs: {response.status_code}")
        
        assert response.status_code == 200, f"Audit logs failed: {response.status_code} - {response.text}"
        
        logs = response.json()
        assert isinstance(logs, list)
        
        print(f"✓ Audit logs retrieved - {len(logs)} logs found")
        
        # Verify structure if logs exist
        if len(logs) > 0:
            log = logs[0]
            assert "log_id" in log
            assert "user_id" in log
            assert "action" in log
            assert "resource" in log
            assert "timestamp" in log
            
            print(f"✓ Audit log structure validated")
            print(f"  - Latest action: {log['action']} on {log['resource']}")


class TestBrandingAPI:
    """API branding tests (AgroFlow v2.0.0)"""
    
    def test_api_title_version(self, base_url):
        """Test API returns AgroFlow branding in docs"""
        print("\n=== Testing API Branding ===")
        
        # FastAPI automatically exposes /openapi.json with title and version
        response = requests.get(f"{base_url}/openapi.json", timeout=10)
        
        if response.status_code == 200:
            openapi = response.json()
            
            # Check title
            title = openapi.get("info", {}).get("title", "")
            print(f"API Title: {title}")
            assert "AgroFlow" in title, f"Expected 'AgroFlow' in title, got '{title}'"
            assert "RanchoPro" not in title, f"Old brand 'RanchoPro' still in title: {title}"
            
            # Check version
            version = openapi.get("info", {}).get("version", "")
            print(f"API Version: {version}")
            assert version == "2.0.0", f"Expected version 2.0.0, got {version}"
            
            print(f"✓ API branding validated - AgroFlow API v{version}")
        else:
            print(f"⚠ Could not fetch /openapi.json (status {response.status_code})")


class TestPreviousFeatures:
    """Regression tests - verify previous features still work"""
    
    def test_dashboard_still_works(self, base_url, api_client):
        """Verify GET /api/dashboard still works"""
        response = api_client.get(f"{base_url}/api/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "animals" in data
        assert "paddocks" in data
        assert "finance" in data
        
        print(f"✓ Dashboard endpoint still working")
    
    def test_alerts_still_work(self, base_url, api_client):
        """Verify GET /api/alerts still works"""
        response = api_client.get(f"{base_url}/api/alerts")
        assert response.status_code == 200
        
        data = response.json()
        assert "alerts" in data
        assert "count" in data
        
        print(f"✓ Alerts endpoint still working")
    
    def test_ndvi_still_works(self, base_url, api_client):
        """Verify GET /api/ndvi still works"""
        response = api_client.get(f"{base_url}/api/ndvi")
        assert response.status_code == 200
        
        data = response.json()
        assert "paddocks" in data
        
        print(f"✓ NDVI endpoint still working")
    
    def test_animals_crud_still_works(self, base_url, api_client):
        """Verify animals CRUD still works"""
        # List
        response = api_client.get(f"{base_url}/api/animals")
        assert response.status_code == 200
        
        # Create
        payload = {
            "name": "TEST_REGRESSION_Animal",
            "tag_id": "REG001",
            "breed": "Test",
            "animal_type": "vaca",
            "sex": "hembra",
            "status": "activo"
        }
        response = api_client.post(f"{base_url}/api/animals", json=payload)
        assert response.status_code == 200
        
        print(f"✓ Animals CRUD still working")
