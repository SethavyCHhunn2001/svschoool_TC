import mongoose from "mongoose";

const { Schema } = mongoose;
const options = { timestamps: true, strict: true };
const make = (name, fields, indexes = []) => {
  const schema = new Schema(fields, options);
  indexes.forEach((index) => schema.index(...index));
  return mongoose.models[name] || mongoose.model(name, schema);
};
const text = { type: String, trim: true };
const requiredText = { type: String, trim: true, required: true };
const ref = (model) => ({ type: Schema.Types.ObjectId, ref: model });
const status = (values) => ({ type: String, enum: values, default: values[0] });

export const User = make("User", {
  name: requiredText,
  email: { ...requiredText, lowercase: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["super_admin", "admin", "teacher", "student", "parent"], default: "admin" },
  linkedStudents: [{ ...ref("Student") }],
  active: { type: Boolean, default: true },
});
export const Student = make("Student", {
  studentId: { ...requiredText, unique: true },
  firstName: requiredText, lastName: requiredText, khmerName: text,
  email: { ...text, lowercase: true, unique: true, sparse: true },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  dateOfBirth: Date, phone: text, address: text,
  grade: { type: Number, min: 7, max: 12, required: true },
  className: text, parentName: text, parentPhone: text,
  status: status(["Active", "Inactive", "Graduated"]),
});
export const Teacher = make("Teacher", {
  teacherId: { ...requiredText, unique: true }, firstName: requiredText, lastName: requiredText,
  email: { ...text, lowercase: true }, phone: text, department: text, qualification: text,
  subjects: [String], status: status(["Active", "On leave", "Inactive"]),
});
export const Parent = make("Parent", {
  name: requiredText, phone: requiredText, email: { ...text, lowercase: true },
  address: text, students: [{ ...ref("Student") }],
});
export const SchoolClass = make("SchoolClass", {
  name: requiredText, grade: { type: Number, min: 7, max: 12, required: true },
  section: requiredText, academicYear: text, room: text, capacity: { type: Number, min: 1, default: 40 },
  classTeacher: ref("Teacher"),
}, [[{ grade: 1, section: 1, academicYear: 1 }, { unique: true, sparse: true }]]);
export const Subject = make("Subject", {
  name: requiredText, code: { ...requiredText, uppercase: true }, grade: { type: Number, min: 7, max: 12 },
  teacher: ref("Teacher"), description: text,
}, [[{ code: 1 }, { unique: true }]]);
export const Enrollment = make("Enrollment", {
  student: { ...ref("Student"), required: true }, schoolClass: { ...ref("SchoolClass"), required: true },
  academicYear: requiredText, enrolledAt: { type: Date, default: Date.now },
  status: status(["Active", "Transferred", "Completed"]),
});
export const Attendance = make("Attendance", {
  student: { ...ref("Student"), required: true }, schoolClass: ref("SchoolClass"),
  date: { type: Date, required: true }, status: { type: String, enum: ["Present", "Absent", "Late", "Excused"], required: true },
  note: text, recordedBy: ref("User"),
}, [[{ student: 1, date: 1 }, { unique: true }]]);
export const Examination = make("Examination", {
  name: requiredText, subject: ref("Subject"), schoolClass: ref("SchoolClass"),
  semester: text, academicYear: text, date: Date, maxScore: { type: Number, min: 1, default: 100 },
});
export const Grade = make("Grade", {
  student: { ...ref("Student"), required: true }, examination: { ...ref("Examination"), required: true },
  score: { type: Number, min: 0, required: true }, letter: { type: String, enum: ["A", "B", "C", "D", "E", "F"] },
  remarks: text,
}, [[{ student: 1, examination: 1 }, { unique: true }]]);
export const Timetable = make("Timetable", {
  schoolClass: ref("SchoolClass"), subject: ref("Subject"), teacher: ref("Teacher"),
  day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] },
  startTime: requiredText, endTime: requiredText, room: text,
});
export const AcademicYear = make("AcademicYear", {
  name: { ...requiredText, unique: true }, startDate: Date, endDate: Date,
  status: status(["Active", "Planned", "Completed"]),
});
export const Semester = make("Semester", {
  name: requiredText, academicYear: ref("AcademicYear"), startDate: Date, endDate: Date,
  status: status(["Active", "Planned", "Completed"]),
});
export const Fee = make("Fee", {
  name: requiredText, grade: { type: Number, min: 7, max: 12 },
  amount: { type: Number, min: 0, required: true }, dueDate: Date,
  academicYear: text, description: text,
});
export const Payment = make("Payment", {
  student: { ...ref("Student"), required: true }, fee: ref("Fee"),
  amount: { type: Number, min: 0.01, required: true }, paidAt: { type: Date, default: Date.now },
  method: { type: String, enum: ["Cash", "Bank transfer", "Mobile payment"], default: "Cash" },
  receiptNumber: { ...text, unique: true, sparse: true }, status: status(["Paid", "Pending", "Refunded"]),
});
export const Announcement = make("Announcement", {
  title: requiredText, body: requiredText, audience: { type: String, enum: ["All", "Staff", "Students", "Parents"], default: "All" },
  publishedAt: { type: Date, default: Date.now }, author: ref("User"), active: { type: Boolean, default: true },
});
export const Notification = make("Notification", {
  user: ref("User"), title: requiredText, body: text, read: { type: Boolean, default: false },
});
export const Book = make("Book", {
  title: requiredText, author: text, isbn: { ...text, unique: true, sparse: true },
  category: text, copies: { type: Number, min: 0, default: 1 }, availableCopies: { type: Number, min: 0, default: 1 },
});
export const LibraryTransaction = make("LibraryTransaction", {
  book: { ...ref("Book"), required: true }, student: { ...ref("Student"), required: true },
  borrowedAt: { type: Date, default: Date.now }, dueAt: Date, returnedAt: Date,
  status: status(["Borrowed", "Returned", "Overdue"]),
});
export const AuditLog = make("AuditLog", {
  actor: ref("User"), action: requiredText, entity: text, recordId: text, details: Schema.Types.Mixed,
});

export const resources = {
  students: Student, teachers: Teacher, parents: Parent, classes: SchoolClass,
  subjects: Subject, enrollments: Enrollment, attendance: Attendance,
  examinations: Examination, grades: Grade, timetable: Timetable,
  "academic-years": AcademicYear, semesters: Semester, fees: Fee, payments: Payment,
  announcements: Announcement, notifications: Notification, books: Book,
  "library-transactions": LibraryTransaction, "audit-logs": AuditLog,
};
