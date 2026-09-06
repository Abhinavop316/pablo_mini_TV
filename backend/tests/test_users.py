import uuid
import pytest
from app.models.user import User, UserRole


def test_admin_list_users(client, admin_token):
    res = client.get("/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


def test_editor_cannot_access_user_management(client, editor_token):
    res = client.get("/admin/users", headers={"Authorization": f"Bearer {editor_token}"})
    assert res.status_code == 403


def test_create_editor_with_setup_token_flow(client, admin_token):
    unique_email = f"editor_{uuid.uuid4().hex[:8]}@example.com"

    # 1. Admin creates editor requesting setup link
    create_res = client.post(
        "/admin/users",
        json={"email": unique_email, "role": "EDITOR", "direct_password": False},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert create_res.status_code == 201
    res_data = create_res.json()
    assert res_data["email"] == unique_email
    assert res_data["setup_token"] is not None
    assert "/setup-password?token=" in res_data["setup_url"]
    token = res_data["setup_token"]
    user_id = res_data["id"]

    # 2. Editor opens setup page and verifies token
    verify_res = client.post("/auth/verify-setup-token", json={"token": token})
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["valid"] is True
    assert verify_data["email"] == unique_email
    assert verify_data["role"] == "EDITOR"

    # 3. Editor sets password and username
    complete_res = client.post(
        "/auth/complete-setup",
        json={"token": token, "username": f"ed_{uuid.uuid4().hex[:6]}", "password": "NewEditorPassword123!"},
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["success"] is True

    # 4. Token cannot be reused
    reused_res = client.post("/auth/verify-setup-token", json={"token": token})
    assert reused_res.status_code == 404

    # 5. Editor logs in with new password
    login_res = client.post(
        "/auth/login",
        json={"email": unique_email, "password": "NewEditorPassword123!"},
    )
    assert login_res.status_code == 200
    assert login_res.json()["role"] == "EDITOR"

    # Cleanup: Delete the test user
    del_res = client.delete(f"/admin/users/{user_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert del_res.status_code == 200


def test_admin_invite_editor_and_status_management(client, admin_token):
    unique_email = f"status_editor_{uuid.uuid4().hex[:8]}@example.com"

    # 1. Admin creates editor (email invitation)
    create_res = client.post(
        "/admin/users",
        json={"email": unique_email, "role": "EDITOR"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert create_res.status_code == 201
    user_id = create_res.json()["id"]
    token = create_res.json()["setup_token"]

    # 2. Editor completes setup
    complete_res = client.post(
        "/auth/complete-setup",
        json={"token": token, "username": f"st_{uuid.uuid4().hex[:6]}", "password": "VerifiedPassword123!"},
    )
    assert complete_res.status_code == 200

    # 3. Editor can log in
    login_res = client.post(
        "/auth/login",
        json={"email": unique_email, "password": "VerifiedPassword123!"},
    )
    assert login_res.status_code == 200

    # 4. Admin updates status (deactivate/suspend)
    status_res = client.patch(
        f"/admin/users/{user_id}/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert status_res.status_code == 200
    assert status_res.json()["is_active"] is False

    # 5. Deactivated user cannot log in
    deactivated_login = client.post(
        "/auth/login",
        json={"email": unique_email, "password": "VerifiedPassword123!"},
    )
    assert deactivated_login.status_code == 403

    # Cleanup
    client.delete(f"/admin/users/{user_id}", headers={"Authorization": f"Bearer {admin_token}"})



def test_admin_send_setup_email(client, admin_token, monkeypatch):
    import app.routers.admin_users as admin_users_mod
    import app.services.email_service as email_service_mod
    mock_email = lambda *args, **kwargs: {"sent": True, "message": "Mock email sent successfully."}
    monkeypatch.setattr(admin_users_mod, "send_password_setup_email", mock_email)
    monkeypatch.setattr(email_service_mod, "send_password_setup_email", mock_email)

    unique_email = f"email_editor_{uuid.uuid4().hex[:8]}@example.com"

    # Create editor
    create_res = client.post(
        "/admin/users",
        json={"email": unique_email, "role": "EDITOR", "direct_password": False},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert create_res.status_code == 201
    user_id = create_res.json()["id"]

    # Resend email endpoint
    send_res = client.post(
        f"/admin/users/{user_id}/send-setup-email",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert send_res.status_code == 200
    data = send_res.json()
    assert data["email"] == unique_email
    assert "/setup-password?token=" in data["setup_url"]
    assert data["success"] is True

    # Cleanup
    client.delete(f"/admin/users/{user_id}", headers={"Authorization": f"Bearer {admin_token}"})

