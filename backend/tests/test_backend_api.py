"""
Comprehensive Backend API Tests for RanchoPro
Tests: Auth, Animals CRUD, Health Records, Weight Records, Paddocks CRUD, Finance CRUD, Dashboard
"""
import pytest
import requests

class TestAuth:
    """Authentication endpoint tests"""
    
    def test_auth_me_success(self, base_url, api_client):
        """Test GET /api/auth/me returns authenticated user"""
        response = api_client.get(f"{base_url}/api/auth/me")
        print(f"Auth /me response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        assert data["name"] == "Test User"
        print(f"✓ /api/auth/me works - User: {data['name']}")

    def test_auth_me_no_token(self, base_url):
        """Test GET /api/auth/me fails without token"""
        response = requests.get(f"{base_url}/api/auth/me")
        print(f"Auth /me without token: {response.status_code}")
        assert response.status_code == 401
        print("✓ /api/auth/me correctly rejects unauthorized requests")


class TestAnimals:
    """Animal CRUD tests"""
    
    def test_get_animals_empty_or_list(self, base_url, api_client):
        """Test GET /api/animals returns list"""
        response = api_client.get(f"{base_url}/api/animals")
        print(f"GET /api/animals: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/animals works - Found {len(data)} animals")

    def test_create_animal_and_verify(self, base_url, api_client, clean_test_data):
        """Test POST /api/animals creates animal and verify persistence"""
        payload = {
            "name": "TEST_Vaca Lola",
            "tag_id": "TEST001",
            "breed": "Angus",
            "animal_type": "vaca",
            "birth_date": "2022-01-15",
            "weight": 450,
            "sex": "hembra",
            "status": "activo",
            "paddock_id": "",
            "notes": "Test animal"
        }
        
        # Create animal
        response = api_client.post(f"{base_url}/api/animals", json=payload)
        print(f"POST /api/animals: {response.status_code}")
        assert response.status_code == 200
        
        created = response.json()
        assert "animal_id" in created
        assert created["name"] == payload["name"]
        assert created["breed"] == payload["breed"]
        assert created["weight"] == payload["weight"]
        
        animal_id = created["animal_id"]
        clean_test_data["animals"].append(animal_id)
        print(f"✓ Created animal: {animal_id}")
        
        # Verify GET by ID
        get_response = api_client.get(f"{base_url}/api/animals/{animal_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["animal_id"] == animal_id
        assert fetched["name"] == payload["name"]
        print(f"✓ Verified animal persistence via GET /api/animals/{animal_id}")

    def test_update_animal_and_verify(self, base_url, api_client, clean_test_data):
        """Test PUT /api/animals/{id} updates animal"""
        # First create
        payload = {
            "name": "TEST_Toro Update",
            "tag_id": "TEST002",
            "breed": "Brahman",
            "animal_type": "toro",
            "birth_date": "2021-06-20",
            "weight": 600,
            "sex": "macho",
            "status": "activo"
        }
        create_res = api_client.post(f"{base_url}/api/animals", json=payload)
        assert create_res.status_code == 200
        animal_id = create_res.json()["animal_id"]
        clean_test_data["animals"].append(animal_id)
        
        # Update
        update_payload = {**payload, "weight": 650, "notes": "Updated weight"}
        update_res = api_client.put(f"{base_url}/api/animals/{animal_id}", json=update_payload)
        print(f"PUT /api/animals/{animal_id}: {update_res.status_code}")
        assert update_res.status_code == 200
        
        # Verify update persisted
        get_res = api_client.get(f"{base_url}/api/animals/{animal_id}")
        assert get_res.status_code == 200
        updated = get_res.json()
        assert updated["weight"] == 650
        assert updated["notes"] == "Updated weight"
        print(f"✓ Animal update verified - weight changed to {updated['weight']}")

    def test_delete_animal_and_verify(self, base_url, api_client):
        """Test DELETE /api/animals/{id} removes animal"""
        # Create
        payload = {"name": "TEST_Delete Me", "animal_type": "ternero", "sex": "macho"}
        create_res = api_client.post(f"{base_url}/api/animals", json=payload)
        animal_id = create_res.json()["animal_id"]
        
        # Delete
        delete_res = api_client.delete(f"{base_url}/api/animals/{animal_id}")
        print(f"DELETE /api/animals/{animal_id}: {delete_res.status_code}")
        assert delete_res.status_code == 200
        
        # Verify deleted
        get_res = api_client.get(f"{base_url}/api/animals/{animal_id}")
        assert get_res.status_code == 404
        print(f"✓ Animal deletion verified - returns 404")

    def test_get_animal_not_found(self, base_url, api_client):
        """Test GET /api/animals/{id} returns 404 for non-existent"""
        response = api_client.get(f"{base_url}/api/animals/nonexistent_id")
        print(f"GET /api/animals/nonexistent: {response.status_code}")
        assert response.status_code == 404
        print("✓ Non-existent animal returns 404")


class TestHealthRecords:
    """Health records tests"""
    
    def test_add_health_record_and_list(self, base_url, api_client, clean_test_data):
        """Test POST /api/animals/{id}/health adds record"""
        # Create animal first
        animal_payload = {"name": "TEST_Health Animal", "animal_type": "vaca", "sex": "hembra"}
        animal_res = api_client.post(f"{base_url}/api/animals", json=animal_payload)
        animal_id = animal_res.json()["animal_id"]
        clean_test_data["animals"].append(animal_id)
        
        # Add health record
        health_payload = {
            "record_type": "vacuna",
            "description": "Fiebre aftosa test",
            "date": "2025-01-15",
            "veterinarian": "Dr. Test",
            "notes": "Test record"
        }
        health_res = api_client.post(f"{base_url}/api/animals/{animal_id}/health", json=health_payload)
        print(f"POST /api/animals/{animal_id}/health: {health_res.status_code}")
        assert health_res.status_code == 200
        
        record = health_res.json()
        assert "record_id" in record
        assert record["description"] == health_payload["description"]
        print(f"✓ Health record created: {record['record_id']}")
        
        # List health records
        list_res = api_client.get(f"{base_url}/api/animals/{animal_id}/health")
        assert list_res.status_code == 200
        records = list_res.json()
        assert isinstance(records, list)
        assert len(records) > 0
        print(f"✓ Health records list works - {len(records)} records")


class TestWeightRecords:
    """Weight records tests"""
    
    def test_add_weight_record_and_list(self, base_url, api_client, clean_test_data):
        """Test POST /api/animals/{id}/weight adds record and updates animal weight"""
        # Create animal
        animal_payload = {"name": "TEST_Weight Animal", "animal_type": "toro", "sex": "macho", "weight": 500}
        animal_res = api_client.post(f"{base_url}/api/animals", json=animal_payload)
        animal_id = animal_res.json()["animal_id"]
        clean_test_data["animals"].append(animal_id)
        
        # Add weight record
        weight_payload = {
            "weight": 550,
            "date": "2025-01-20",
            "notes": "Pesaje mensual test"
        }
        weight_res = api_client.post(f"{base_url}/api/animals/{animal_id}/weight", json=weight_payload)
        print(f"POST /api/animals/{animal_id}/weight: {weight_res.status_code}")
        assert weight_res.status_code == 200
        
        record = weight_res.json()
        assert record["weight"] == 550
        print(f"✓ Weight record created: {record['weight']} kg")
        
        # Verify animal weight updated
        animal_res = api_client.get(f"{base_url}/api/animals/{animal_id}")
        animal = animal_res.json()
        assert animal["weight"] == 550
        print(f"✓ Animal weight updated to {animal['weight']} kg")
        
        # List weight records
        list_res = api_client.get(f"{base_url}/api/animals/{animal_id}/weight")
        assert list_res.status_code == 200
        records = list_res.json()
        assert len(records) > 0
        print(f"✓ Weight records list works - {len(records)} records")


class TestPaddocks:
    """Paddock CRUD tests"""
    
    def test_get_paddocks_list(self, base_url, api_client):
        """Test GET /api/paddocks returns list"""
        response = api_client.get(f"{base_url}/api/paddocks")
        print(f"GET /api/paddocks: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/paddocks works - Found {len(data)} paddocks")

    def test_create_paddock_and_verify(self, base_url, api_client, clean_test_data):
        """Test POST /api/paddocks creates paddock"""
        payload = {
            "name": "TEST_Potrero Norte",
            "area_hectares": 15,
            "grass_type": "Brachiaria",
            "grass_status": "bueno",
            "capacity": 20,
            "center_lat": 4.6097,
            "center_lng": -74.0817,
            "status": "activo",
            "notes": "Test paddock"
        }
        
        response = api_client.post(f"{base_url}/api/paddocks", json=payload)
        print(f"POST /api/paddocks: {response.status_code}")
        assert response.status_code == 200
        
        created = response.json()
        assert "paddock_id" in created
        assert created["name"] == payload["name"]
        assert created["area_hectares"] == payload["area_hectares"]
        assert "animal_count" in created
        
        paddock_id = created["paddock_id"]
        clean_test_data["paddocks"].append(paddock_id)
        print(f"✓ Paddock created: {paddock_id}")
        
        # Verify GET by ID
        get_res = api_client.get(f"{base_url}/api/paddocks/{paddock_id}")
        assert get_res.status_code == 200
        fetched = get_res.json()
        assert fetched["paddock_id"] == paddock_id
        print(f"✓ Paddock persistence verified")

    def test_update_paddock_and_verify(self, base_url, api_client, clean_test_data):
        """Test PUT /api/paddocks/{id} updates paddock"""
        # Create
        payload = {"name": "TEST_Potrero Sur", "area_hectares": 10, "grass_status": "regular", "capacity": 15, "status": "activo"}
        create_res = api_client.post(f"{base_url}/api/paddocks", json=payload)
        paddock_id = create_res.json()["paddock_id"]
        clean_test_data["paddocks"].append(paddock_id)
        
        # Update
        update_payload = {**payload, "grass_status": "bueno", "notes": "Mejorado"}
        update_res = api_client.put(f"{base_url}/api/paddocks/{paddock_id}", json=update_payload)
        print(f"PUT /api/paddocks/{paddock_id}: {update_res.status_code}")
        assert update_res.status_code == 200
        
        # Verify
        get_res = api_client.get(f"{base_url}/api/paddocks/{paddock_id}")
        updated = get_res.json()
        assert updated["grass_status"] == "bueno"
        print(f"✓ Paddock update verified - grass_status changed to {updated['grass_status']}")

    def test_delete_paddock_and_verify(self, base_url, api_client):
        """Test DELETE /api/paddocks/{id}"""
        # Create
        payload = {"name": "TEST_Delete Paddock", "area_hectares": 5, "capacity": 10, "status": "activo"}
        create_res = api_client.post(f"{base_url}/api/paddocks", json=payload)
        paddock_id = create_res.json()["paddock_id"]
        
        # Delete
        delete_res = api_client.delete(f"{base_url}/api/paddocks/{paddock_id}")
        print(f"DELETE /api/paddocks/{paddock_id}: {delete_res.status_code}")
        assert delete_res.status_code == 200
        
        # Verify
        get_res = api_client.get(f"{base_url}/api/paddocks/{paddock_id}")
        assert get_res.status_code == 404
        print("✓ Paddock deletion verified")


class TestFinance:
    """Finance CRUD and summary tests"""
    
    def test_get_finances_list(self, base_url, api_client):
        """Test GET /api/finances returns list"""
        response = api_client.get(f"{base_url}/api/finances")
        print(f"GET /api/finances: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/finances works - Found {len(data)} records")

    def test_create_finance_and_verify(self, base_url, api_client, clean_test_data):
        """Test POST /api/finances creates record"""
        payload = {
            "transaction_type": "ingreso",
            "category": "venta_ganado",
            "amount": 2500000,
            "description": "TEST_Venta de novillos",
            "date": "2025-01-10"
        }
        
        response = api_client.post(f"{base_url}/api/finances", json=payload)
        print(f"POST /api/finances: {response.status_code}")
        assert response.status_code == 200
        
        created = response.json()
        assert "finance_id" in created
        assert created["amount"] == payload["amount"]
        assert created["transaction_type"] == payload["transaction_type"]
        
        finance_id = created["finance_id"]
        clean_test_data["finances"].append(finance_id)
        print(f"✓ Finance record created: {finance_id}")

    def test_delete_finance_and_verify(self, base_url, api_client):
        """Test DELETE /api/finances/{id}"""
        # Create
        payload = {"transaction_type": "gasto", "category": "veterinario", "amount": 150000, "description": "TEST_Delete"}
        create_res = api_client.post(f"{base_url}/api/finances", json=payload)
        finance_id = create_res.json()["finance_id"]
        
        # Delete
        delete_res = api_client.delete(f"{base_url}/api/finances/{finance_id}")
        print(f"DELETE /api/finances/{finance_id}: {delete_res.status_code}")
        assert delete_res.status_code == 200
        print("✓ Finance deletion works")

    def test_finance_summary(self, base_url, api_client):
        """Test GET /api/finances/summary returns aggregated data"""
        response = api_client.get(f"{base_url}/api/finances/summary")
        print(f"GET /api/finances/summary: {response.status_code}")
        assert response.status_code == 200
        
        summary = response.json()
        assert "total_income" in summary
        assert "total_expense" in summary
        assert "profit" in summary
        assert "categories" in summary
        assert "transaction_count" in summary
        print(f"✓ Finance summary works - Profit: ${summary['profit']}, Transactions: {summary['transaction_count']}")


class TestDashboard:
    """Dashboard KPI endpoint test"""
    
    def test_dashboard_kpis(self, base_url, api_client):
        """Test GET /api/dashboard returns all KPIs"""
        response = api_client.get(f"{base_url}/api/dashboard")
        print(f"GET /api/dashboard: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "animals" in data
        assert "paddocks" in data
        assert "finance" in data
        assert "recent_health" in data
        
        # Verify animals KPIs
        animals = data["animals"]
        assert "total" in animals
        assert "cows" in animals
        assert "bulls" in animals
        assert "calves" in animals
        assert "heifers" in animals
        assert "avg_weight" in animals
        
        # Verify paddocks KPIs
        paddocks = data["paddocks"]
        assert "total" in paddocks
        assert "active" in paddocks
        assert "grass_good" in paddocks
        
        # Verify finance KPIs
        finance = data["finance"]
        assert "total_income" in finance
        assert "total_expense" in finance
        assert "profit" in finance
        
        print(f"✓ Dashboard works - Animals: {animals['total']}, Paddocks: {paddocks['total']}, Profit: ${finance['profit']}")


class TestSeedData:
    """Seed data endpoint test"""
    
    def test_seed_creates_sample_data(self, base_url, api_client):
        """Test POST /api/seed creates sample data (only if not already seeded)"""
        response = api_client.post(f"{base_url}/api/seed")
        print(f"POST /api/seed: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "seeded" in data
        
        if data["seeded"]:
            print(f"✓ Seed data created successfully")
        else:
            print(f"✓ Seed endpoint works - Data already exists")
