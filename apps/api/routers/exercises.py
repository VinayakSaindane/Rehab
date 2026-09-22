from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import get_db_collection
from models.schemas import ExerciseResponse, ExerciseCreate
from routers.auth import get_current_user

router = APIRouter(prefix="/exercises", tags=["Exercises"])

@router.get("", response_model=List[ExerciseResponse])
async def list_exercises():
    exercises_col = get_db_collection("exercises")
    cursor = exercises_col.find({})
    return await cursor.to_list(length=100)

@router.get("/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(exercise_id: str):
    exercises_col = get_db_collection("exercises")
    exercise = await exercises_col.find_one({"id": exercise_id})
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise

@router.post("", response_model=ExerciseResponse)
async def create_exercise(exercise: ExerciseCreate, current_user: dict = Depends(get_current_user)):
    exercises_col = get_db_collection("exercises")
    existing = await exercises_col.find_one({"id": exercise.id})
    if existing:
        raise HTTPException(status_code=400, detail="Exercise with this ID already exists")
    await exercises_col.insert_one(exercise.dict())
    return exercise
