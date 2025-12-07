---
description: Add Academic Features (Schools, Teachers, Parents)
---

# Add Academic Features

This workflow outlines the steps to add comprehensive academic features to the Muse platform, including support for Institutions, Teachers, Parents, and Classrooms.

## 1. Backend: Update `muse-auth-service`

- [ ] Create `Institution` entity (name, type, address, etc.).
- [ ] Create `InstitutionRepository`.
- [ ] Update `User` entity to link to `Institution` (ManyToOne).
- [ ] Create `ParentStudent` entity or ensure `User` self-reference works for Parent-Child linking.
- [ ] Create endpoints for:
    - Creating Institutions (Admin only).
    - Linking Users to Institutions.
    - Linking Parents to Students.

## 2. Backend: Create `muse-academic-service`

- [ ] Scaffold new Spring Boot service `muse-academic-service`.
- [ ] Define Entities:
    - `Classroom` (name, subject, teacherId, institutionId).
    - `ClassMember` (studentId, classroomId).
    - `Assignment` (title, description, dueDate, classroomId).
    - `Submission` (assignmentId, studentId, content, grade).
    - `Attendance` (studentId, classroomId, date, status).
    - `ReportCard` (studentId, term, grades).
- [ ] Implement Service Logic & Controllers.
- [ ] Configure Security (JWT validation).
- [ ] Add to `docker-compose.yml`.

## 3. Backend: Update `muse-chat-service`

- [ ] Ensure `Conversation` supports `Classroom` context (already done with `contextType`).
- [ ] Add logic to auto-create group chats for Classrooms.

## 4. Frontend: Create Dashboards

- [ ] **Parent Dashboard**:
    - View Children.
    - View Child's Classes, Assignments, Grades.
    - Message Teacher button.
- [ ] **Teacher Dashboard**:
    - Manage Classrooms.
    - Create Assignments.
    - View Submissions.
    - "Smart Class" Mode (Projector view).
- [ ] **Institution Admin Dashboard**:
    - Manage Teachers/Students.
    - View Stats.

## 5. Integration

- [ ] Update `nginx.conf` to route `/api/academic` to `muse-academic-service`.
- [ ] Update Frontend API client.
