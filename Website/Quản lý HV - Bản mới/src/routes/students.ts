import { Router, Response, NextFunction } from 'express'
import { db, C, s, toObj, toDocs, paginate } from '../lib/firebase'
import { authenticate } from '../middleware/auth'
import { AuthRequest } from '../types'
import type { Student, ClassEnrollment, StudentAttendance, PrivateSession } from '../types/models'

const router = Router()
router.use(authenticate)

const now = () => new Date().toISOString()

// GET /api/students
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', search, status, classId, gradeLevel } = req.query as Record<string, string>

    const rawDocs = await db.collection(C.STUDENTS).get()
    let students = toDocs<Student>(rawDocs).map(s => {
      const name = s.fullName || (s as any).name || ''
      let st = s.status
      if (st === 'Đang học' || st === 'Mới nhập học') st = 'ACTIVE'
      else if (st === 'Đã nghỉ') st = 'INACTIVE'
      else if (st === 'Bảo lưu') st = 'RESERVED'

      let gl = s.gradeLevel
      if (gl == null && (s as any).birthYear) {
        const by = Number((s as any).birthYear)
        if (by >= 2008 && by <= 2014) gl = 2020 - by
      }

      return {
        ...s,
        fullName: name,
        status: st || 'ACTIVE',
        gradeLevel: gl != null ? Number(gl) : null
      }
    })

    // Sort in memory by fullName
    students.sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'))

    // Filter
    if (status) students = students.filter(s => s.status === status)
    if (gradeLevel) students = students.filter(s => s.gradeLevel === Number(gradeLevel))
    if (search) students = students.filter(s => (s.fullName || '').toLowerCase().includes(search.toLowerCase()))

    // Filter by classId: lấy studentIds từ enrollments
    if (classId) {
      const enrollSnap = await db.collection(C.ENROLLMENTS)
        .where('classId', '==', classId)
        .where('status', '==', 'ACTIVE')
        .get()
      const ids = new Set(enrollSnap.docs.map(d => d.data().studentId as string))
      students = students.filter(s => ids.has(s.id))
    }

    // Gắn primary parent cho mỗi học viên
    const result = await Promise.all(
      students.map(async s => {
        const parentsSnap = await db.collection(C.STUDENTS).doc(s.id)
          .collection('parents')
          .where('isPrimaryContact', '==', true)
          .limit(1)
          .get()
        const primaryParent = parentsSnap.empty ? null : { id: parentsSnap.docs[0].id, ...parentsSnap.docs[0].data() }

        const enrollSnap = await db.collection(C.ENROLLMENTS)
          .where('studentId', '==', s.id)
          .where('status', '==', 'ACTIVE')
          .get()
        const enrollments = toDocs<ClassEnrollment>(enrollSnap)

        return { ...s, primaryParent, enrollments }
      })
    )

    res.json(paginate(result, Number(page), Number(limit)))
  } catch (err) {
    next(err)
  }
})

// POST /api/students/bulk-deactivate-grades — Chuyển tất cả học viên khối 10, 11, 12 sang Đã nghỉ
router.post('/bulk-deactivate-grades', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const targetGrades = new Set([10, 11, 12])
    const snap = await db.collection(C.STUDENTS).get()
    const nowISO = new Date().toISOString()
    const todayStr = nowISO.slice(0, 10)

    let batch = db.batch()
    let count = 0

    snap.docs.forEach(docSnap => {
      const data = docSnap.data()
      const gl = Number(data.gradeLevel)
      const className = data.className || ''
      const isHs = targetGrades.has(gl) || /\b(10|11|12)\b/.test(className) || data.birthYear === 2008 || data.birthYear === 2009 || data.birthYear === 2010

      if (isHs && data.status !== 'INACTIVE' && data.status !== 'Đã nghỉ') {
        batch.update(docSnap.ref, {
          status: 'INACTIVE',
          leaveDate: todayStr,
          updatedAt: nowISO
        })
        count++
      }
    })

    if (count > 0) {
      await batch.commit()
    }

    res.json({ message: `Đã chuyển ${count} học viên Khối 10, 11, 12 sang trạng thái Đã nghỉ`, updatedCount: count })
  } catch (err) {
    next(err)
  }
})

// POST /api/students/bulk — Import hàng loạt từ Excel
router.post('/bulk', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { students } = req.body as {
      students: Array<{
        fullName: string
        dateOfBirth?: string
        gender?: string
        school?: string
        gradeLevel?: string | number
        address?: string
        notes?: string
        parentName?: string
        parentPhone?: string
        className?: string
        enrollmentDate?: string
      }>
    }
    if (!students?.length) { res.status(400).json({ message: 'Danh sách rỗng' }); return }

    // Cache class name → classId lookup (tránh truy vấn trùng)
    const classCache: Record<string, { id: string; name: string } | null> = {}
    const lookupClass = async (name: string) => {
      const key = name.trim().toLowerCase()
      if (key in classCache) return classCache[key]
      const snap = await db.collection(C.CLASSES).get()
      for (const doc of snap.docs) {
        const n = (doc.data().name as string ?? '').trim().toLowerCase()
        if (n === key) { classCache[key] = { id: doc.id, name: doc.data().name as string }; return classCache[key] }
      }
      classCache[key] = null
      return null
    }

    const created: string[] = []
    const failed: { row: number; name: string; error: string }[] = []

    for (let i = 0; i < students.length; i++) {
      const s = students[i]
      if (!s.fullName?.trim()) { failed.push({ row: i + 1, name: '', error: 'Thiếu họ tên' }); continue }
      try {
        const studentData = {
          fullName: s.fullName.trim(),
          dateOfBirth: s.dateOfBirth || null,
          gender: s.gender || null,
          school: s.school || null,
          gradeLevel: s.gradeLevel ? Number(s.gradeLevel) : null,
          address: s.address || null,
          notes: s.notes || null,
          enrollmentDate: s.enrollmentDate || now().slice(0, 10),
          status: 'ACTIVE',
          createdAt: now(), updatedAt: now(),
        }
        const ref = await db.collection(C.STUDENTS).add(studentData)
        const studentId = ref.id

        if (s.parentName?.trim()) {
          await db.collection(C.STUDENTS).doc(studentId).collection('parents').add({
            studentId,
            fullName: s.parentName.trim(),
            phone: s.parentPhone?.trim() || null,
            relationship: 'PHỤ HUYNH',
            isPrimary: true,
            createdAt: now(),
          })
        }

        if (s.className?.trim()) {
          const cls = await lookupClass(s.className)
          if (cls) {
            await db.collection(C.ENROLLMENTS).add({
              classId: cls.id,
              className: cls.name,
              studentId,
              studentName: s.fullName.trim(),
              enrollmentDate: s.enrollmentDate || now().slice(0, 10),
              status: 'ACTIVE',
              createdAt: now(),
            })
          } else {
            // Ghi chú lỗi phụ nhưng không fail học viên
            failed.push({ row: i + 1, name: s.fullName, error: `Không tìm thấy lớp "${s.className}" — học viên đã được tạo nhưng chưa đăng ký lớp` })
          }
        }

        created.push(studentId)
      } catch (err: any) {
        failed.push({ row: i + 1, name: s.fullName, error: err.message ?? 'Lỗi không xác định' })
      }
    }

    res.status(201).json({ message: `Đã thêm ${created.length} học viên`, created: created.length, failed })
  } catch (err) { next(err) }
})

// GET /api/students/private-sessions?fromDate=&toDate= — Tất cả lịch học riêng theo tuần
router.get('/private-sessions/all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate } = req.query as Record<string, string>
    let query = db.collection(C.PRIVATE_SCHEDULES) as FirebaseFirestore.Query
    if (fromDate) query = query.where('sessionDate', '>=', fromDate)
    if (toDate) query = query.where('sessionDate', '<=', toDate)
    const snap = await query.get()
    res.json(toDocs(snap))
  } catch (err) { next(err) }
})

// GET /api/students/:id — Hồ sơ chi tiết
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await db.collection(C.STUDENTS).doc(s(req.params.id)).get()
    if (!doc.exists) { res.status(404).json({ message: 'Không tìm thấy học viên' }); return }

    const rawStudent = toObj<Student>(doc)
    const fullName = rawStudent.fullName || (rawStudent as any).name || ''
    let st = rawStudent.status
    if (st === 'Đang học' || st === 'Mới nhập học') st = 'ACTIVE'
    else if (st === 'Đã nghỉ') st = 'INACTIVE'
    else if (st === 'Bảo lưu') st = 'RESERVED'

    const student = {
      ...rawStudent,
      fullName,
      status: st || 'ACTIVE'
    }

    // Subcollection parents
    const parentsSnap = await db.collection(C.STUDENTS).doc(student.id).collection('parents').get()
    const parents = parentsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Enrollments
    const enrollSnap = await db.collection(C.ENROLLMENTS)
      .where('studentId', '==', student.id)
      .get()
    const enrollments = toDocs<ClassEnrollment>(enrollSnap)

    // Tuition records (6 tháng gần nhất) — sort in memory to avoid composite index requirement
    const tuitionSnap = await db.collection(C.TUITION_RECORDS)
      .where('studentId', '==', student.id)
      .get()
    const tuitionRecords = toDocs(tuitionSnap)
      .sort((a: any, b: any) => b.billingYear - a.billingYear || b.billingMonth - a.billingMonth)
      .slice(0, 6)

    // Promotions đang hiệu lực
    let promotions: any[] = []
    try {
      const promoSnap = await db.collection(C.STUDENT_PROMOTIONS)
        .where('studentId', '==', student.id)
        .get()
      promotions = toDocs(promoSnap).filter((p: any) => p.appliedTo == null)
    } catch (_) { /* index chưa tạo — bỏ qua */ }

    res.json({ ...student, parents, enrollments, tuitionRecords, promotions })
  } catch (err) {
    next(err)
  }
})

// POST /api/students
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fullName, dateOfBirth, gender, school, gradeLevel, address, notes, parents } = req.body

    const studentData: Omit<Student, 'id'> = {
      fullName,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      school: school || null,
      gradeLevel: gradeLevel ? Number(gradeLevel) : null,
      address: address || null,
      enrollmentDate: now().slice(0, 10),
      status: 'ACTIVE',
      notes: notes || null,
      createdAt: now(),
      updatedAt: now(),
    } as Omit<Student, 'id'>

    const ref = await db.collection(C.STUDENTS).add(studentData)
    const studentId = ref.id

    // Thêm parents vào subcollection
    if (parents?.length) {
      const batch = db.batch()
      for (const p of parents as Record<string, unknown>[]) {
        const pRef = db.collection(C.STUDENTS).doc(studentId).collection('parents').doc()
        batch.set(pRef, { ...p, studentId, createdAt: now() })
      }
      await batch.commit()
    }

    const created = toObj<Student>(await ref.get())
    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
})

// PUT /api/students/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fullName, dateOfBirth, gender, school, gradeLevel, address, status, notes, enrollmentDate, parentName, phone, parentId } = req.body
    const studentId = s(req.params.id)

    const updates: Record<string, unknown> = { updatedAt: now() }
    if (fullName !== undefined) updates.fullName = fullName
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth
    if (gender !== undefined) updates.gender = gender
    if (school !== undefined) updates.school = school
    if (gradeLevel !== undefined) updates.gradeLevel = gradeLevel ? Number(gradeLevel) : null
    if (address !== undefined) updates.address = address
    if (status !== undefined) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (enrollmentDate !== undefined) updates.enrollmentDate = enrollmentDate

    await db.collection(C.STUDENTS).doc(studentId).update(updates)

    // Cập nhật hoặc tạo mới primary parent
    if (parentName !== undefined || phone !== undefined) {
      const parentRef = parentId
        ? db.collection(C.STUDENTS).doc(studentId).collection('parents').doc(s(parentId))
        : null

      if (parentRef) {
        await parentRef.update({ fullName: parentName ?? '', phone: phone ?? '' })
      } else if (parentName || phone) {
        await db.collection(C.STUDENTS).doc(studentId).collection('parents').add({
          fullName: parentName || '',
          phone: phone || '',
          isPrimaryContact: true,
          studentId,
          createdAt: now(),
        })
      }
    }

    const updated = toObj<Student>(await db.collection(C.STUDENTS).doc(studentId).get())
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// POST /api/students/:id/enroll/:enrollmentId/remove — xoá enrollment
router.post('/:id/enroll/:enrollmentId/remove', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.collection(C.ENROLLMENTS).doc(s(req.params.enrollmentId)).delete()
    res.json({ message: 'Đã xoá đăng ký lớp học' })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/students/:id — soft delete
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.collection(C.STUDENTS).doc(s(req.params.id)).update({ status: 'INACTIVE', updatedAt: now() })
    res.json({ message: 'Đã chuyển học viên sang trạng thái không hoạt động' })
  } catch (err) {
    next(err)
  }
})

// POST /api/students/:id/enroll — Đăng ký lớp
router.post('/:id/enroll', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = s(req.params.id)
    const { classId, enrollmentDate, customTuitionRate, notes } = req.body as { classId: string; enrollmentDate?: string; customTuitionRate?: number; notes?: string }

    // Lấy thông tin student và class để denormalize
    const [studentDoc, classDoc] = await Promise.all([
      db.collection(C.STUDENTS).doc(studentId).get(),
      db.collection(C.CLASSES).doc(classId).get(),
    ])

    if (!studentDoc.exists || !classDoc.exists) {
      res.status(404).json({ message: 'Không tìm thấy học viên hoặc lớp học' }); return
    }

    const enrollment: Record<string, unknown> = {
      classId,
      className: classDoc.data()!.name as string,
      studentId,
      studentName: studentDoc.data()!.fullName as string,
      enrollmentDate: enrollmentDate || now().slice(0, 10),
      status: 'ACTIVE',
      createdAt: now(),
    }
    if (customTuitionRate) enrollment.customTuitionRate = Number(customTuitionRate)
    if (notes) enrollment.notes = notes

    const ref = await db.collection(C.ENROLLMENTS).add(enrollment)
    res.status(201).json({ id: ref.id, ...enrollment })
  } catch (err) {
    next(err)
  }
})

// PUT /api/students/:id/enroll/:enrollmentId — Cập nhật thông tin đăng ký lớp (ngày đăng ký, ...)
router.put('/:id/enroll/:enrollmentId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { enrollmentDate, customTuitionRate, notes } = req.body
    const updates: Record<string, unknown> = {}
    if (enrollmentDate !== undefined) updates.enrollmentDate = enrollmentDate
    if (customTuitionRate !== undefined) updates.customTuitionRate = customTuitionRate ? Number(customTuitionRate) : null
    if (notes !== undefined) updates.notes = notes

    await db.collection(C.ENROLLMENTS).doc(s(req.params.enrollmentId)).update(updates)
    res.json({ message: 'Đã cập nhật thông tin đăng ký lớp' })
  } catch (err) {
    next(err)
  }
})

// PUT /api/students/:id/enroll/:enrollmentId/drop
router.put('/:id/enroll/:enrollmentId/drop', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dropDate } = req.body
    await db.collection(C.ENROLLMENTS).doc(s(req.params.enrollmentId)).update({
      status: 'DROPPED',
      dropDate: dropDate || now().slice(0, 10),
    })
    res.json({ message: 'Đã nghỉ lớp' })
  } catch (err) {
    next(err)
  }
})

// GET /api/students/:id/attendance
router.get('/:id/attendance', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { month, year, classId } = req.query as Record<string, string>
    const studentId = req.params.id

    // Không dùng orderBy kèm where để tránh yêu cầu composite index
    let query = db.collection(C.STUDENT_ATTENDANCES).where('studentId', '==', studentId)
    if (classId) query = query.where('classId', '==', classId)

    const snap = await query.get()
    let attendances = toDocs<StudentAttendance>(snap)
      .sort((a, b) => (b.sessionDate > a.sessionDate ? 1 : -1))

    // Filter by month/year in memory
    if (month && year) {
      const m = month.padStart(2, '0')
      attendances = attendances.filter(a => {
        const d = a.sessionDate.slice(0, 7) // "YYYY-MM"
        return d === `${year}-${m}`
      })
    }

    res.json(attendances)
  } catch (err) {
    next(err)
  }
})

// GET /api/students/:id/schedule?month=X&year=Y
// Trả về lịch học cá nhân của học viên trong tháng: sessions của tất cả lớp đang học
router.get('/:id/schedule', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = req.params.id
    const now = new Date()
    const month = Number((req.query.month as string) || now.getMonth() + 1)
    const year  = Number((req.query.year  as string) || now.getFullYear())

    // 1. Lấy tất cả enrollments của học viên (kể cả dropped để xem lịch cũ)
    const enrollSnap = await db.collection(C.ENROLLMENTS)
      .where('studentId', '==', studentId)
      .get()
    const enrollments = toDocs<ClassEnrollment>(enrollSnap)

    // 2. Với mỗi lớp, lấy sessions của tháng đó (filter in memory tránh index)
    const monthStr = `${year}-${String(month).padStart(2, '0')}`

    // Lấy thông tin lớp (tuitionRate, teacher) từ collection classes
    const classIds = [...new Set(enrollments.map(e => e.classId))]
    const classDocs = await Promise.all(
      classIds.map(cid => db.collection(C.CLASSES).doc(cid).get())
    )
    const classMap: Record<string, Record<string, unknown>> = {}
    classDocs.forEach(d => { if (d.exists) classMap[d.id] = { id: d.id, ...d.data() } })

    // Lấy sessions của từng lớp
    const sessionsByClass = await Promise.all(
      classIds.map(cid =>
        db.collection(C.SESSIONS).where('classId', '==', cid).get()
          .then(snap => toDocs(snap))
      )
    )

    // Gộp và filter theo tháng
    const allSessions: Record<string, unknown>[] = []
    sessionsByClass.forEach((sessions, idx) => {
      const cid = classIds[idx]
      const cls = classMap[cid] || {}
      const enroll = enrollments.find(e => e.classId === cid)

      sessions
        .filter((s: any) => {
          if (!s.sessionDate || !s.sessionDate.startsWith(monthStr)) return false
          // Không hiển thị buổi trước ngày đăng ký
          if (enroll?.enrollmentDate && s.sessionDate < enroll.enrollmentDate) return false
          // Không hiển thị buổi sau ngày nghỉ (với enrollment đã drop)
          if (enroll?.status === 'DROPPED' && enroll.dropDate && s.sessionDate > enroll.dropDate) return false
          return true
        })
        .forEach((s: any) => {
          // Học phí buổi: ưu tiên customTuitionRate của enrollment, fallback về class tuitionRate
          const rate = (enroll?.customTuitionRate as number) || (cls.tuitionRate as number) || 0
          allSessions.push({
            ...s,
            className: (cls.name as string) || s.className,
            teacherName: (cls.teacherName as string) || s.teacherName,
            ratePerSession: rate,
          })
        })
    })

    // Sắp xếp theo ngày rồi giờ
    allSessions.sort((a: any, b: any) => {
      if (a.sessionDate !== b.sessionDate) return b.sessionDate.localeCompare(a.sessionDate)
      return (b.startTime || '').localeCompare(a.startTime || '')
    })

    res.json(allSessions)
  } catch (err) {
    next(err)
  }
})

// GET /api/students/:id/tuition-summary
// Tính học phí từ sessions thực tế, không cần phiếu học phí
router.get('/:id/tuition-summary', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = req.params.id

    // 1. Tất cả enrollments (cả DROPPED)
    const enrollSnap = await db.collection(C.ENROLLMENTS)
      .where('studentId', '==', studentId)
      .get()
    const enrollments = toDocs<ClassEnrollment>(enrollSnap)

    // 2. Lấy thông tin lớp (tuitionRate)
    const classIds = [...new Set(enrollments.map(e => e.classId))]
    const classDocs = await Promise.all(classIds.map(id => db.collection(C.CLASSES).doc(id).get()))
    const classMap: Record<string, any> = {}
    classDocs.forEach(d => { if (d.exists) classMap[d.id] = { id: d.id, ...d.data() } })

    // 3. Sessions của từng lớp — lọc theo khoảng thời gian đăng ký
    const rows: Record<string, {
      monthKey: string; month: number; year: number
      classId: string; className: string
      totalSessions: number; ratePerSession: number
      discountAmount: number
    }> = {}

    await Promise.all(enrollments.map(async (enroll) => {
      const fromDate = enroll.enrollmentDate ?? '2000-01-01'
      const toDate   = enroll.status === 'DROPPED' && (enroll as any).dropDate
        ? (enroll as any).dropDate
        : '9999-12-31'

      const sessSnap = await db.collection(C.SESSIONS)
        .where('classId', '==', enroll.classId)
        .get()
      const sessions = toDocs<any>(sessSnap).filter((s: any) =>
        s.sessionDate >= fromDate && s.sessionDate <= toDate && s.status !== 'CANCELLED'
      )

      const cls = classMap[enroll.classId] ?? {}
      const rate = (enroll as any).customTuitionRate || cls.tuitionRate || 0

      // Promotions của enrollment này
      const today = new Date().toISOString().slice(0, 10)
      const promoSnap = await db.collection(C.STUDENT_PROMOTIONS)
        .where('studentId', '==', studentId)
        .where('classId', '==', enroll.classId)
        .get()
      const promos = toDocs<any>(promoSnap).filter(p =>
        (!p.appliedTo || p.appliedTo >= fromDate) && (!p.appliedFrom || p.appliedFrom <= today)
      )

      // Nhóm sessions theo tháng
      const monthCounts: Record<string, number> = {}
      sessions.forEach((s: any) => {
        const mk = s.sessionDate.slice(0, 7) // "YYYY-MM"
        monthCounts[mk] = (monthCounts[mk] ?? 0) + 1
      })

      Object.entries(monthCounts).forEach(([mk, count]) => {
        const [y, m] = mk.split('-')
        const baseAmt = count * rate

        let discount = 0
        for (const p of promos) {
          if (p.promotionType === 'PERCENTAGE') discount += (baseAmt * p.promotionValue) / 100
          else if (p.promotionType === 'FIXED_AMOUNT') discount += p.promotionValue
          else if (p.promotionType === 'FREE_SESSIONS') discount += p.promotionValue * rate
        }
        discount = Math.min(discount, baseAmt)

        const key = `${mk}__${enroll.classId}`
        if (!rows[key]) {
          rows[key] = {
            monthKey: mk, month: Number(m), year: Number(y),
            classId: enroll.classId, className: enroll.className || cls.name || '',
            totalSessions: 0, ratePerSession: rate, discountAmount: 0,
          }
        }
        rows[key].totalSessions += count
        rows[key].discountAmount += discount
      })
    }))

    // Học riêng (privateSchedules)
    const privateSnap = await db.collection(C.PRIVATE_SCHEDULES)
      .where('studentId', '==', studentId)
      .get()
    const privateSessions = toDocs<any>(privateSnap).filter((s: any) => s.status !== 'CANCELLED')

    // Promotions cho học riêng
    const privatePromoSnap = await db.collection(C.STUDENT_PROMOTIONS)
      .where('studentId', '==', studentId)
      .where('classId', '==', 'private')
      .get()
    const privatePromos = toDocs<any>(privatePromoSnap)

    const privateMonthCounts: Record<string, { count: number; totalAmount: number }> = {}
    for (const ps of privateSessions) {
      const mk = ps.sessionDate.slice(0, 7)
      if (!privateMonthCounts[mk]) privateMonthCounts[mk] = { count: 0, totalAmount: 0 }
      privateMonthCounts[mk].count += 1
      privateMonthCounts[mk].totalAmount += ps.ratePerSession || 0
    }

    for (const [mk, { count, totalAmount }] of Object.entries(privateMonthCounts)) {
      const [y, m] = mk.split('-')
      const avgRate = count > 0 ? Math.round(totalAmount / count) : 0
      const today = new Date().toISOString().slice(0, 10)
      const monthFrom = `${mk}-01`
      const activePrivatePromos = privatePromos.filter(p =>
        (!p.appliedTo || p.appliedTo >= monthFrom) && (!p.appliedFrom || p.appliedFrom <= today)
      )
      let privateDiscount = 0
      for (const p of activePrivatePromos) {
        if (p.promotionType === 'PERCENTAGE') privateDiscount += (totalAmount * p.promotionValue) / 100
        else if (p.promotionType === 'FIXED_AMOUNT') privateDiscount += p.promotionValue
      }
      privateDiscount = Math.min(privateDiscount, totalAmount)

      rows[`${mk}__private`] = {
        monthKey: mk, month: Number(m), year: Number(y),
        classId: 'private', className: 'Học riêng',
        totalSessions: count, ratePerSession: avgRate, discountAmount: privateDiscount,
      }
    }

    const result = Object.values(rows)
      .map(r => {
        if (r.classId === 'private') {
          const base = privateSessions
            .filter((ps: any) => ps.sessionDate.startsWith(r.monthKey) && ps.status !== 'CANCELLED')
            .reduce((sum: number, ps: any) => sum + (ps.ratePerSession || 0), 0)
          return { ...r, baseAmount: base, finalAmount: Math.max(0, base - r.discountAmount) }
        }
        return {
          ...r,
          baseAmount: r.totalSessions * r.ratePerSession,
          finalAmount: Math.max(0, r.totalSessions * r.ratePerSession - r.discountAmount),
        }
      })
      .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)

    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ─── PRIVATE SCHEDULES ────────────────────────────────────────

// GET /api/students/:id/private-schedule?month=X&year=Y
router.get('/:id/private-schedule', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = s(req.params.id)
    const { month, year } = req.query as Record<string, string>

    const snap = await db.collection(C.PRIVATE_SCHEDULES)
      .where('studentId', '==', studentId)
      .get()

    let sessions = toDocs<PrivateSession>(snap)

    if (month && year) {
      const monthStr = `${year}-${String(Number(month)).padStart(2, '0')}`
      sessions = sessions.filter(s => s.sessionDate.startsWith(monthStr))
    }

    sessions.sort((a, b) =>
      a.sessionDate !== b.sessionDate
        ? b.sessionDate.localeCompare(a.sessionDate)
        : (b.startTime ?? '').localeCompare(a.startTime ?? '')
    )

    res.json(sessions)
  } catch (err) { next(err) }
})

// POST /api/students/:id/private-schedule — tạo nhiều buổi
router.post('/:id/private-schedule', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = s(req.params.id)
    const { sessions } = req.body as {
      sessions: Array<{ sessionDate: string; startTime?: string; endTime?: string; ratePerSession: number; notes?: string }>
    }

    if (!sessions?.length) { res.status(400).json({ message: 'Cần ít nhất 1 buổi học' }); return }

    const studentDoc = await db.collection(C.STUDENTS).doc(studentId).get()
    if (!studentDoc.exists) { res.status(404).json({ message: 'Không tìm thấy học viên' }); return }
    const studentName = studentDoc.data()!.fullName as string

    const created = await Promise.all(sessions.map(sess => {
      const data: Omit<PrivateSession, 'id'> = {
        studentId, studentName,
        sessionDate: sess.sessionDate,
        startTime: sess.startTime,
        endTime: sess.endTime,
        ratePerSession: Number(sess.ratePerSession) || 0,
        status: 'SCHEDULED',
        notes: sess.notes,
        createdAt: now(), updatedAt: now(),
      }
      return db.collection(C.PRIVATE_SCHEDULES).add(data).then(ref => ({ id: ref.id, ...data }))
    }))

    res.status(201).json({ message: `Đã tạo ${created.length} buổi học riêng`, sessions: created })
  } catch (err) { next(err) }
})

// PUT /api/students/:id/private-schedule/:sessionId
router.put('/:id/private-schedule/:sessionId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startTime, endTime, teacherName } = req.body
    const updates: Record<string, unknown> = { updatedAt: now() }
    if (startTime !== undefined) updates.startTime = startTime || null
    if (endTime !== undefined) updates.endTime = endTime || null
    if (teacherName !== undefined) updates.teacherName = teacherName || null
    await db.collection(C.PRIVATE_SCHEDULES).doc(s(req.params.sessionId)).update(updates)
    res.json({ message: 'Đã cập nhật buổi học' })
  } catch (err) { next(err) }
})

// DELETE /api/students/:id/private-schedule/:sessionId
router.delete('/:id/private-schedule/:sessionId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.collection(C.PRIVATE_SCHEDULES).doc(s(req.params.sessionId)).delete()
    res.json({ message: 'Đã xoá buổi học' })
  } catch (err) { next(err) }
})

export default router
