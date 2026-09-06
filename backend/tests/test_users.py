import uuid
import pytest
from app.models.user import User, UserRole


def test_admin_list_users(client, admin_token):
    res = client.get("/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 2
    roles = [u["role"] for u in data["items"]]
    assert "ADMIN" in roles
    assert "EDITOR" in roles


def test_editor_cannot_access_user_management(client, editor_token):
    res = client.get("/admin/users", headers={"Authorization": f"Bearer {editor_token}"})
    assert res.status_code == 403


def test_create_user_is_disabled(client, admin_token):
    create_res = client.post(
        "/admin/users",
        json={"email": "newuser@example.com", "role": "EDITOR"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert create_res.status_code == 403
    assert create_res.json()["detail"]["code"] == "ROLE_CREATION_DISABLED"


def test_delete_user_is_disabled(client, admin_token):
    del_res = client.delete(
        "/admin/users/1",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_res.status_code == 403
    assert del_res.json()["detail"]["code"] == "ROLE_DELETION_DISABLED"


