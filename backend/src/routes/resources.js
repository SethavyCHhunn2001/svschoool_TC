import { Router } from "express";
import { resources, AuditLog } from "../models/index.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateResource } from "../middleware/validateResource.js";

const router = Router();
const roles = ["super_admin", "admin", "teacher", "student", "parent"];
const canManage = {
  students: ["super_admin", "admin"], teachers: ["super_admin", "admin"],
  parents: ["super_admin", "admin"], classes: ["super_admin", "admin"],
  subjects: ["super_admin", "admin"], enrollments: ["super_admin", "admin"],
  attendance: ["super_admin", "admin", "teacher"], examinations: ["super_admin", "admin", "teacher"],
  grades: ["super_admin", "admin", "teacher"], timetable: ["super_admin", "admin", "teacher"],
  "academic-years": ["super_admin", "admin"], semesters: ["super_admin", "admin"],
  fees: ["super_admin", "admin"], payments: ["super_admin", "admin"],
  announcements: ["super_admin", "admin"], notifications: ["super_admin", "admin"],
  books: ["super_admin", "admin"], "library-transactions": ["super_admin", "admin", "teacher"],
  "audit-logs": ["super_admin"],
};
const learnerReadable = new Set(["students", "attendance", "grades", "payments", "timetable", "announcements", "notifications"]);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.use(authenticate);
router.post("/:resource", validateResource);
router.patch("/:resource/:id", validateResource);
router.get("/dashboard", authorize(...roles), async (req, res) => {
  const learner = ["student", "parent"].includes(req.user.role);
  let linkedStudentIds = [];
  if (req.user.role === "student") {
    const profile = await resources.students.findOne({ email: req.user.email }).select("_id").lean();
    linkedStudentIds = profile ? [profile._id] : [];
  } else if (req.user.role === "parent") {
    linkedStudentIds = req.user.linkedStudents;
  }
  const studentFilter = learner ? { _id: { $in: linkedStudentIds } } : {};
  const linkedRecordFilter = learner ? { student: { $in: linkedStudentIds } } : {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [students, teachers, classes, parents, attendance, payments] = await Promise.all([
    resources.students.countDocuments({ ...studentFilter, status: "Active" }),
    learner ? 0 : resources.teachers.countDocuments({ status: "Active" }),
    learner ? 0 : resources.classes.countDocuments(),
    learner ? 0 : resources.parents.countDocuments(),
    resources.attendance.find({ ...linkedRecordFilter, date: { $gte: today } }).lean(),
    resources.payments.find({ ...linkedRecordFilter, status: "Paid" }).select("amount paidAt").lean(),
  ]);
  const present = attendance.filter(({ status }) => status === "Present" || status === "Late").length;
  const attendancePercent = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  const revenue = payments.reduce((total, payment) => total + payment.amount, 0);
  const recentStudents = await resources.students.find(studentFilter).sort({ createdAt: -1 }).limit(5).select("studentId firstName lastName grade className createdAt").lean();
  const audienceFilter = learner
    ? { audience: { $in: ["All", req.user.role === "parent" ? "Parents" : "Students"] } }
    : {};
  const recentAnnouncements = await resources.announcements.find({ active: true, ...audienceFilter }).sort({ publishedAt: -1 }).limit(4).select("title audience publishedAt").lean();
  res.json({
    success: true,
    data: { students, teachers, classes, parents, attendanceToday: attendance.length, attendancePercent, revenue, recentStudents, recentAnnouncements },
  });
});

router.get("/:resource", async (req, res, next) => {
  const Model = resources[req.params.resource];
  if (!Model) return next();
  if (!canManage[req.params.resource]?.includes(req.user.role) &&
      !(["student", "parent"].includes(req.user.role) && learnerReadable.has(req.params.resource))) {
    return res.status(403).json({ success: false, message: "You do not have permission to view this resource" });
  }
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const filter = {};
    let linkedStudentIds = [];
    if (req.user.role === "student") {
      const profile = await resources.students.findOne({ email: req.user.email }).select("_id").lean();
      linkedStudentIds = profile ? [profile._id] : [];
    } else if (req.user.role === "parent") {
      linkedStudentIds = req.user.linkedStudents;
    }
    if (["student", "parent"].includes(req.user.role)) {
      if (req.params.resource === "students") {
        filter._id = { $in: linkedStudentIds };
        if (req.user.role === "student" && linkedStudentIds.length === 0) filter.email = req.user.email;
      } else if (["attendance", "grades", "payments"].includes(req.params.resource)) {
        filter.student = { $in: linkedStudentIds };
      } else if (req.params.resource === "timetable") {
        const enrolled = await resources.enrollments.find({ student: { $in: linkedStudentIds }, status: "Active" }).select("schoolClass").lean();
        filter.schoolClass = { $in: enrolled.map(({ schoolClass }) => schoolClass) };
      } else if (req.params.resource === "notifications") {
        filter.user = req.user._id;
      } else if (req.params.resource === "announcements") {
        filter.active = true;
        filter.audience = { $in: ["All", req.user.role === "parent" ? "Parents" : "Students"] };
      }
    }
    if (search) {
      const searchable = Object.keys(Model.schema.paths).filter((key) => ["String", "Number"].includes(Model.schema.paths[key].instance));
      if (searchable.length) filter.$and = [{ $or: searchable.map((key) => ({ [key]: { $regex: escapeRegex(search), $options: "i" } })) }];
    }
    const [items, total] = await Promise.all([
      Model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Model.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.post("/:resource", async (req, res, next) => {
  const Model = resources[req.params.resource];
  if (!Model) return next();
  if (!canManage[req.params.resource]?.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "You do not have permission to create this resource" });
  }
  try {
    const item = await Model.create(req.validatedBody);
    await AuditLog.create({ actor: req.user.id, action: "create", entity: req.params.resource, recordId: item.id });
    res.status(201).json({ success: true, data: item });
  } catch (error) { next(error); }
});

router.patch("/:resource/:id", async (req, res, next) => {
  const Model = resources[req.params.resource];
  if (!Model) return next();
  if (!canManage[req.params.resource]?.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "You do not have permission to update this resource" });
  }
  try {
    const item = await Model.findByIdAndUpdate(req.params.id, req.validatedBody, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: "Record not found" });
    await AuditLog.create({ actor: req.user.id, action: "update", entity: req.params.resource, recordId: item.id });
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
});

router.delete("/:resource/:id", async (req, res, next) => {
  const Model = resources[req.params.resource];
  if (!Model) return next();
  if (!canManage[req.params.resource]?.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "You do not have permission to delete this resource" });
  }
  try {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Record not found" });
    await AuditLog.create({ actor: req.user.id, action: "delete", entity: req.params.resource, recordId: req.params.id });
    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) { next(error); }
});

export default router;
