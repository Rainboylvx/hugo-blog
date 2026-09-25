"""The enrollment use case and the storage interface it needs."""

from typing import Protocol

from .domain import Course, Student, check_enrollment


class EnrollmentStore(Protocol):
    def get_student(self, student_id: int) -> Student | None: ...

    def get_course(self, course_id: int) -> Course | None: ...

    def has_enrollment(self, student_id: int, course_id: int) -> bool: ...

    def count_enrollments(self, course_id: int) -> int: ...

    def add_enrollment(self, student_id: int, course_id: int) -> None: ...


class EnrollmentService:
    def __init__(self, store: EnrollmentStore) -> None:
        self.store = store

    def enroll(self, student_id: int, course_id: int) -> None:
        student = self.store.get_student(student_id)
        course = self.store.get_course(course_id)
        already_enrolled = self.store.has_enrollment(student_id, course_id)
        enrolled_count = self.store.count_enrollments(course_id)
        check_enrollment(student, course, already_enrolled, enrolled_count)
        self.store.add_enrollment(student_id, course_id)
