import { db, C } from '../lib/firebase'

async function deactivateHighSchoolStudents() {
  console.log('🔄 Bắt đầu chuyển tất cả học viên Khối 10, 11, 12 sang trạng thái Đã nghỉ...')
  
  const targetGrades = new Set([10, 11, 12])
  const snap = await db.collection(C.STUDENTS).get()
  
  let updatedCount = 0
  const batch = db.batch()
  const now = new Date().toISOString()
  const todayStr = now.slice(0, 10)

  for (const doc of snap.docs) {
    const data = doc.data()
    const gl = Number(data.gradeLevel)
    const currentStatus = data.status

    if (targetGrades.has(gl) && currentStatus !== 'INACTIVE' && currentStatus !== 'Đã nghỉ') {
      console.log(`- Cập nhật HV: ${data.fullName} (Lớp ${gl}) | Status cũ: ${currentStatus}`)
      batch.update(doc.ref, {
        status: 'INACTIVE',
        leaveDate: todayStr,
        updatedAt: now
      })
      updatedCount++
    }
  }

  if (updatedCount > 0) {
    await batch.commit()
    console.log(`✅ Đã chuyển thành công ${updatedCount} học viên Khối 10, 11, 12 sang trạng thái Đã nghỉ (INACTIVE).`)
  } else {
    console.log('ℹ️ Không tìm thấy học viên Khối 10, 11, 12 nào đang học cần chuyển trạng thái.')
  }
}

deactivateHighSchoolStudents()
  .catch(err => {
    console.error('❌ Lỗi khi cập nhật:', err)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
