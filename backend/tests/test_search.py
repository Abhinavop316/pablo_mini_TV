def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "ok"


def test_public_catalog_endpoint(client):
    response = client.get("/catalog")
    assert response.status_code == 200
    data = response.json()
    assert "sections" in data
    assert "all_shows" in data


def test_public_search_by_query(client):
    response = client.get("/catalog/search?q=moti")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Moti" in s["title"] for s in data["shows"])


def test_public_search_by_category(client):
    response = client.get("/catalog/search?category=Adventure")
    assert response.status_code == 200
    data = response.json()
    assert any("adventure" in s["category"].lower() for s in data["shows"])


def test_public_search_by_language(client):
    response = client.get("/catalog/search?language=Hindi")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


def test_public_search_empty_result(client):
    response = client.get("/catalog/search?q=nonexistentqueryxyz123")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert len(data["shows"]) == 0

