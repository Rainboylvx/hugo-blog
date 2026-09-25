"""SQLite implementation of the storage operations required by the service."""

import sqlite3
from contextlib import closing
from pathlib import Path

from .domain import AlreadyEnrolled, Course, Student


class SQLiteEnrollmentStore:
    def __init__(self, path: str | Path) -> None:
        self.path = str(path)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path)
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def init_db(self) -> None:
        with closing(self._connect()) as conn, conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS students (
                    id INTEGER PRIMARY KEY, name TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS courses (
                    id INTEGER PRIMARY KEY, title TEXT NOT NULL,
                    capacity INTEGER NOT NULL CHECK (capacity > 0)
                );
                CREATE TABLE IF NOT EXISTS enrollments (
                    student_id INTEGER NOT NULL REFERENCES students(id),
                    course_id INTEGER NOT NULL REFERENCES courses(id),
                    PRIMARY KEY (student_id, course_id)
                );
            """)
            conn.execute(
                "INSERT OR IGNORE INTO students (id, name) VALUES (?, ?)",
                (1, "小明"),
            )
            conn.execute(
                "INSERT OR IGNORE INTO courses (id, title, capacity) VALUES (?, ?, ?)",
                (1, "Python 入门", 2),
            )

    def get_student(self, student_id: int) -> Student | None:
        with closing(self._connect()) as conn:
            row = conn.execute(
                "SELECT id, name FROM students WHERE id = ?", (student_id,)
            ).fetchone()
        return Student(*row) if row else None

    def get_course(self, course_id: int) -> Course | None:
        with closing(self._connect()) as conn:
            row = conn.execute(
                "SELECT id, title, capacity FROM courses WHERE id = ?", (course_id,)
            ).fetchone()
        return Course(*row) if row else None

    def has_enrollment(self, student_id: int, course_id: int) -> bool:
        with closing(self._connect()) as conn:
            row = conn.execute(
                "SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?",
                (student_id, course_id),
            ).fetchone()
        return row is not None

    def count_enrollments(self, course_id: int) -> int:
        with closing(self._connect()) as conn:
            row = conn.execute(
                "SELECT COUNT(*) FROM enrollments WHERE course_id = ?", (course_id,)
            ).fetchone()
        return row[0]

    def add_enrollment(self, student_id: int, course_id: int) -> None:
        try:
            with closing(self._connect()) as conn, conn:
                conn.execute(
                    "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
                    (student_id, course_id),
                )
        except sqlite3.IntegrityError as exc:
            # A duplicate may race with the earlier read. Other constraint
            # failures should remain database errors instead of being mislabeled.
            if self.has_enrollment(student_id, course_id):
                raise AlreadyEnrolled("该学生已报名这门课程") from exc
            raise
