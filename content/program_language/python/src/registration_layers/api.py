"""HTTP adapter and application assembly."""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .db import SQLiteEnrollmentStore
from .domain import AlreadyEnrolled, CourseFull, CourseNotFound, StudentNotFound
from .service import EnrollmentService


class EnrollmentRequest(BaseModel):
    student_id: int
    course_id: int


store = SQLiteEnrollmentStore("enrollment.db")
store.init_db()
service = EnrollmentService(store)
app = FastAPI()


@app.post("/enrollments", status_code=201)
def enroll(request: EnrollmentRequest) -> dict[str, int]:
    try:
        service.enroll(request.student_id, request.course_id)
    except (StudentNotFound, CourseNotFound) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except (AlreadyEnrolled, CourseFull) as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"student_id": request.student_id, "course_id": request.course_id}
