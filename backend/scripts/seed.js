import "dotenv/config";
import bcrypt from "bcryptjs";
import connectDatabase from "../src/config/database.js";
import { User, Student, Teacher, SchoolClass, Subject, Announcement, AcademicYear } from "../src/models/index.js";

await connectDatabase();
const email = process.env.SEED_ADMIN_EMAIL || "admin@svschool.edu.kh";
const password = process.env.SEED_ADMIN_PASSWORD;
if (!password || password.length < 12) {
  throw new Error("Set SEED_ADMIN_PASSWORD to a password of at least 12 characters before seeding");
}
await User.updateOne(
  { email },
  { $setOnInsert: { name: "School Administrator", email, password: await bcrypt.hash(password, 12), role: "super_admin" } },
  { upsert: true },
);
if (await Student.countDocuments() === 0) {
  await Student.insertMany([
    { studentId: "SV-2026-001", firstName: "Sokha", lastName: "Chan", khmerName: "ចាន់ សុខា", gender: "Female", email: "sokha.student@svschool.edu.kh", grade: 10, className: "10-A", status: "Active" },
    { studentId: "SV-2026-002", firstName: "Dara", lastName: "Lim", khmerName: "លឹម ដារ៉ា", gender: "Male", grade: 11, className: "11-B", status: "Active" },
    { studentId: "SV-2026-003", firstName: "Sreypov", lastName: "Mey", khmerName: "ម៉ី ស្រីពៅ", gender: "Female", grade: 9, className: "9-A", status: "Active" },
  ]);
}
if (await Teacher.countDocuments() === 0) {
  await Teacher.insertMany([
    { teacherId: "T-001", firstName: "Sophea", lastName: "Khim", department: "Mathematics", qualification: "B.Ed", status: "Active" },
    { teacherId: "T-002", firstName: "Vanna", lastName: "Sok", department: "Science", qualification: "B.Sc", status: "Active" },
  ]);
}
if (await SchoolClass.countDocuments() === 0) {
  await SchoolClass.insertMany(["7-A", "8-A", "9-A", "10-A", "11-A", "12-A"].map((name, index) => ({
    name, grade: index + 7, section: "A", academicYear: "2026-2027", capacity: 40,
  })));
}
if (await Subject.countDocuments() === 0) {
  await Subject.insertMany([
    { name: "Mathematics", code: "MATH", grade: 10 },
    { name: "Khmer Literature", code: "KHMER", grade: 10 },
    { name: "Physics", code: "PHYS", grade: 10 },
    { name: "English", code: "ENG", grade: 10 },
  ]);
}
if (await AcademicYear.countDocuments() === 0) {
  await AcademicYear.create({ name: "2026-2027", startDate: new Date("2026-11-01"), endDate: new Date("2027-08-31"), status: "Active" });
}
if (await Announcement.countDocuments() === 0) {
  await Announcement.create({ title: "Welcome to the new academic year", body: "Classes for the 2026-2027 academic year are now in session.", audience: "All" });
}
console.log(`Seed data ready. Admin login: ${email}`);
process.exit(0);
