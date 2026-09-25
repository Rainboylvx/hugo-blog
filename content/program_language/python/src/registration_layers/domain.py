"""Business concepts and rules; no HTTP or database imports."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Student:
    id: int
    name: str


@dataclass(frozen=True)
class Course:
    id: int
    title: str
    capacity: int


class EnrollmentError(Exception):
    """Expected failure of an enrollment request."""


class StudentNotFound(EnrollmentError):
    pass


class CourseNotFound(EnrollmentError):
    pass


class AlreadyEnrolled(EnrollmentError):
    pass


class CourseFull(EnrollmentError):
    pass


def check_enrollment(
    student: Student | None,
    course: Course | None,
    already_enrolled: bool,
    enrolled_count: int,
) -> None:
    if student is None:
        raise StudentNotFound("学生不存在")
    if course is None:
        raise CourseNotFound("课程不存在")
    if already_enrolled:
        raise AlreadyEnrolled("该学生已报名这门课程")
    if enrolled_count >= course.capacity:
        raise CourseFull("课程已满")
