# Database model overview

MongoDB stores Mongoose documents with timestamps (`createdAt`, `updatedAt`). The API model registry in `backend/src/models/index.js` defines each schema and its references.

| Collection | Key relationships and constraints |
|---|---|
| users | Unique lower-case email, hashed password, role, linked student IDs |
| students | Unique student ID and optional unique email; grade constrained to 7–12 |
| teachers | Unique teacher ID; department, qualifications, and subject list |
| parents | Contact details and references to linked students |
| classes | Grade, section, year, room, capacity, optional teacher; unique grade/section/year |
| subjects | Unique subject code and optional teacher |
| enrollments | Student and class references; academic year and enrollment status |
| attendance | Student and recorder references; unique student/date; four attendance states |
| examinations | Subject and class references, semester, date, and maximum score |
| grades | Student and examination references; unique student/examination pair |
| timetables | Class, subject, and teacher references; weekday and time range |
| academic_years / semesters | School-year and semester date ranges and status |
| fees / payments | Fee definitions and student-linked payment records |
| announcements / notifications | Publication audience and user notification state |
| books / library_transactions | Book inventory and student borrowing lifecycle |
| audit_logs | Actor, action, entity, and affected record ID |

MongoDB creates indexes declared by each Mongoose model. Production deployments should configure database authentication, backups, TLS, and monitored index migrations.
