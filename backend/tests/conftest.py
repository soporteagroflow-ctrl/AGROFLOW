import pytest
import requests
import os

@pytest.fixture(scope="session")
def base_url():
    """Get base URL from environment"""
    url = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
    if not url:
        raise ValueError("EXPO_PUBLIC_BACKEND_URL not set in environment")
    return url.rstrip('/')

@pytest.fixture(scope="session")
def session_token():
    """Test session token from MongoDB"""
    return "test_session_1772785918320"

@pytest.fixture(scope="session")
def api_client(session_token):
    """Authenticated API client"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {session_token}"
    })
    return session

@pytest.fixture
def clean_test_data():
    """Cleanup function for test data"""
    created_ids = {
        "animals": [],
        "paddocks": [],
        "finances": []
    }
    yield created_ids
    # Cleanup logic can be added here if needed
