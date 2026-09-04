from fastapi import APIRouter

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me")
def get_my_profile():
    return {"message": "My profile"}


@router.put("/me")
def update_my_profile():
    return {"message": "Profile updated"}


@router.get("/{user_id}")
def get_user(user_id: int):
    return {
        "user_id": user_id
    }