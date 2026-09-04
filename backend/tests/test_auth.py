def test_valid_login(client):
    response = client.post("/auth/login", json={"email": "admin@example.com", "password": "Admin@123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"
    assert data["email"] == "admin@example.com"


def test_invalid_password(client):
    response = client.post("/auth/login", json={"email": "admin@example.com", "password": "WrongPassword"})
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_CREDENTIALS"


def test_auth_me_with_valid_token(client, admin_token):
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@example.com"
    assert data["role"] == "ADMIN"


def test_protected_endpoint_without_token(client):
    response = client.get("/admin/shows")
    assert response.status_code == 401


def test_editor_cannot_publish_catalog(client, editor_token):
    response = client.post("/admin/catalog/publish", headers={"Authorization": f"Bearer {editor_token}"})
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "ADMIN_REQUIRED"


def test_admin_can_publish_catalog(client, admin_token):
    response = client.post("/admin/catalog/publish", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code in [200, 400]  # 200 if valid, 400 if validation issues exist, but never 403
