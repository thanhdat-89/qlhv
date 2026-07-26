import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import api from '../services/api'
import { Student, ClassEnrollment, TuitionRecord, Parent, Class, StudentPromotion, PrivateSession } from '../types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(date?: string | null) {
  if (!date) return '—'
  const cleanDate = date.trim().slice(0, 10)
  if (cleanDate.includes('-')) {
    const parts = cleanDate.split('-')
    if (parts.length === 3) {
      const [y, m, d] = parts
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y.length === 2 ? '20' + y : y}`
    }
  }
  if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/')
    if (parts.length === 3) {
      const [d, m, y] = parts
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y.length === 2 ? '20' + y : y}`
    }
  }
  return date
}

function fmtMoney(n: number) {
  return n.toLocaleString('vi-VN') + 'đ'
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase font-bold text-outline tracking-wider">{label}</span>
      <p className="text-on-surface font-medium">{value || '—'}</p>
    </div>
  )
}

function TuitionStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: 'bg-secondary-container/50 text-on-secondary-container',
    PARTIAL: 'bg-primary-container/20 text-primary',
    PENDING: 'bg-error-container/20 text-error',
    OVERPAID: 'bg-secondary-container text-on-secondary-container',
  }
  const labels: Record<string, string> = {
    PAID: 'Đã thanh toán',
    PARTIAL: 'Một phần',
    PENDING: 'Chưa nộp',
    OVERPAID: 'Thừa',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${map[status] ?? 'bg-surface-container-high text-outline'}`}>
      {labels[status] ?? status}
    </span>
  )
}

// ─── Edit Student Modal ──────────────────────────────────────────────────────

function EditStudentModal({ student, onClose, onSaved }: { student: Student; onClose: () => void; onSaved: (s: Student) => void }) {
  const [form, setForm] = useState({
    fullName: student.fullName ?? '',
    dateOfBirth: student.dateOfBirth ?? '',
    gender: student.gender ?? '',
    school: student.school ?? '',
    gradeLevel: student.gradeLevel?.toString() ?? '',
    address: student.address ?? '',
    status: student.status ?? 'ACTIVE',
    notes: student.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim()) { setError('Vui lòng nhập họ tên'); return }
    setSaving(true); setError('')
    try {
      const res = await api.put(`/students/${student.id}`, {
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        school: form.school || null,
        gradeLevel: form.gradeLevel || null,
        address: form.address || null,
        status: form.status,
        notes: form.notes || null,
      })
      onSaved(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Chỉnh sửa hồ sơ" onClose={onClose}>
      {error && <div className="mb-4 p-3 bg-error-container/10 text-error rounded-xl text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Họ và tên *">
              <input value={form.fullName} onChange={set('fullName')} required className="input" placeholder="Nguyễn Văn A" />
            </Field>
          </div>
          <Field label="Ngày sinh">
            <input value={form.dateOfBirth} onChange={set('dateOfBirth')} type="date" className="input" />
          </Field>
          <Field label="Giới tính">
            <select value={form.gender} onChange={set('gender')} className="input">
              <option value="">Không rõ</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </select>
          </Field>
          <Field label="Trường học">
            <input value={form.school} onChange={set('school')} className="input" placeholder="THCS Nguyễn Du" />
          </Field>
          <Field label="Khối lớp">
            <select value={form.gradeLevel} onChange={set('gradeLevel')} className="input">
              <option value="">—</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Lớp {g}</option>)}
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Địa chỉ">
              <input value={form.address} onChange={set('address')} className="input" placeholder="123 Đường ABC, Quận 1" />
            </Field>
          </div>
          <Field label="Trạng thái">
            <select value={form.status} onChange={set('status')} className="input">
              <option value="ACTIVE">Đang học</option>
              <option value="INACTIVE">Đã nghỉ</option>
              <option value="RESERVED">Bảo lưu</option>
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Ghi chú">
              <textarea value={form.notes} onChange={set('notes')} className="input resize-none" rows={2} placeholder="Ghi chú thêm..." />
            </Field>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary justify-center">Huỷ</button>
          <button type="submit" disabled={saving} className="flex-1 btn-primary justify-center disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Cập nhật'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Parent Modal ────────────────────────────────────────────────────────────

function ParentModal({ studentId, parent, onClose, onSaved }: {
  studentId: string
  parent: (Parent & { id: string }) | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!parent
  const [form, setForm] = useState({
    fullName: parent?.fullName ?? '',
    relationship: parent?.relationship ?? '',
    phone: parent?.phone ?? '',
    zalo: parent?.zalo ?? '',
    email: parent?.email ?? '',
    isPrimaryContact: parent?.isPrimaryContact ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim()) { setError('Vui lòng nhập tên phụ huynh'); return }
    setSaving(true); setError('')
    try {
      if (isEdit) {
        await api.put(`/parents/${studentId}/${parent!.id}`, form)
      } else {
        await api.post('/parents', { ...form, studentId })
      }
      onSaved()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Chỉnh sửa phụ huynh' : 'Thêm phụ huynh'} onClose={onClose}>
      {error && <div className="mb-4 p-3 bg-error-container/10 text-error rounded-xl text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Họ và tên *">
              <input value={form.fullName} onChange={set('fullName')} required className="input" placeholder="Nguyễn Thị B" />
            </Field>
          </div>
          <Field label="Quan hệ">
            <select value={form.relationship} onChange={set('relationship')} className="input">
              <option value="">—</option>
              <option value="Bố">Bố</option>
              <option value="Mẹ">Mẹ</option>
              <option value="Anh/Chị">Anh/Chị</option>
              <option value="Ông/Bà">Ông/Bà</option>
              <option value="Người giám hộ">Người giám hộ</option>
            </select>
          </Field>
          <Field label="Số điện thoại">
            <input value={form.phone} onChange={set('phone')} type="tel" className="input" placeholder="0901 234 567" />
          </Field>
          <Field label="Zalo">
            <input value={form.zalo} onChange={set('zalo')} className="input" placeholder="0901 234 567" />
          </Field>
          <Field label="Email">
            <input value={form.email} onChange={set('email')} type="email" className="input" placeholder="email@example.com" />
          </Field>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isPrimaryContact} onChange={set('isPrimaryContact')}
            className="w-4 h-4 accent-primary" />
          <span className="text-sm font-medium text-on-surface">Đặt là liên hệ chính</span>
        </label>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary justify-center">Huỷ</button>
          <button type="submit" disabled={saving} className="flex-1 btn-primary justify-center disabled:opacity-60">
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm phụ huynh'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Enroll Modal ────────────────────────────────────────────────────────────

function EnrollModal({ studentId, onClose, onSaved }: { studentId: string; onClose: () => void; onSaved: () => void }) {
  const [classes, setClasses] = useState<Class[]>([])
  const [classId, setClassId] = useState('')
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/classes', { params: { status: 'ACTIVE', limit: 100 } })
      .then(r => setClasses(r.data?.data ?? r.data ?? []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId) { setError('Vui lòng chọn lớp học'); return }
    setSaving(true); setError('')
    try {
      await api.post(`/students/${studentId}/enroll`, { classId, enrollmentDate })
      onSaved()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Đăng ký lớp học" onClose={onClose}>
      {error && <div className="mb-4 p-3 bg-error-container/10 text-error rounded-xl text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Lớp học *">
          <select value={classId} onChange={e => setClassId(e.target.value)} required className="input">
            <option value="">Chọn lớp...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.teacherName ?? ''}</option>
            ))}
          </select>
        </Field>
        <Field label="Ngày đăng ký">
          <input value={enrollmentDate} onChange={e => setEnrollmentDate(e.target.value)} type="date" className="input" />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary justify-center">Huỷ</button>
          <button type="submit" disabled={saving} className="flex-1 btn-primary justify-center disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Đăng ký'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Payment Modal ───────────────────────────────────────────────────────────

function PaymentModal({ record, onClose, onSaved }: { record: TuitionRecord; onClose: () => void; onSaved: () => void }) {
  const remaining = record.finalAmount - record.paidAmount
  const [form, setForm] = useState({
    amount: remaining > 0 ? remaining.toString() : '',
    method: 'CASH',
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) { setError('Số tiền không hợp lệ'); return }
    setSaving(true); setError('')
    try {
      await api.post(`/tuition/${record.id}/payment`, {
        amount,
        method: form.method,
        paymentDate: form.paymentDate,
        notes: form.notes || undefined,
      })
      onSaved()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Ghi nhận thanh toán" onClose={onClose}>
      <div className="mb-4 p-4 bg-surface-container-low rounded-xl">
        <p className="text-sm text-outline mb-1">{record.className} — Tháng {record.billingMonth}/{record.billingYear}</p>
        <div className="flex justify-between text-sm">
          <span className="text-on-surface-variant">Phải nộp:</span>
          <span className="font-bold text-on-surface">{fmtMoney(record.finalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-on-surface-variant">Đã nộp:</span>
          <span className="font-medium text-secondary">{fmtMoney(record.paidAmount)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1 border-t border-outline-variant/10 pt-1">
          <span className="text-on-surface-variant">Còn lại:</span>
          <span className={`font-bold ${remaining > 0 ? 'text-error' : 'text-secondary'}`}>{fmtMoney(remaining)}</span>
        </div>
      </div>
      {error && <div className="mb-4 p-3 bg-error-container/10 text-error rounded-xl text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Số tiền nộp (đ) *">
          <input value={form.amount} onChange={set('amount')} type="number" min="1000" required className="input" placeholder="0" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hình thức">
            <select value={form.method} onChange={set('method')} className="input">
              <option value="CASH">Tiền mặt</option>
              <option value="BANK_TRANSFER">Chuyển khoản</option>
              <option value="MOMO">MoMo</option>
              <option value="ZALOPAY">ZaloPay</option>
            </select>
          </Field>
          <Field label="Ngày nộp">
            <input value={form.paymentDate} onChange={set('paymentDate')} type="date" className="input" />
          </Field>
        </div>
        <Field label="Ghi chú">
          <input value={form.notes} onChange={set('notes')} className="input" placeholder="Ghi chú..." />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary justify-center">Huỷ</button>
          <button type="submit" disabled={saving} className="flex-1 btn-primary justify-center disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Ghi nhận'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Shared UI atoms ─────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl p-8 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-headline font-bold text-on-surface">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  )
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
        <p className="text-on-surface font-medium mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-secondary justify-center">Huỷ</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-error text-on-error rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center">Xác nhận</button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Info ───────────────────────────────────────────────────────────────

function InfoTab({
  student,
  parents,
  enrollments,
  onRefresh,
  onEdit,
  onStatusChange,
}: {
  student: Student & { id: string }
  parents: (Parent & { id: string })[]
  enrollments: ClassEnrollment[]
  onRefresh: () => void
  onEdit: () => void
  onStatusChange: (status: 'ACTIVE' | 'INACTIVE' | 'RESERVED') => void
}) {
  const [parentModal, setParentModal] = useState<{ open: boolean; parent: (Parent & { id: string }) | null }>({ open: false, parent: null })
  const [enrollModal, setEnrollModal] = useState(false)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)

  const deleteEnrollment = (e: ClassEnrollment) => {
    setConfirm({
      message: `Xoá lớp "${e.className}" khỏi danh sách đã nghỉ? Lớp này sẽ bị xoá hoàn toàn khỏi lịch học cá nhân của học viên.`,
      onConfirm: async () => {
        setConfirm(null)
        try {
          const url = `/students/${student.id}/enroll/${e.id}/remove`
          console.log('[deleteEnrollment] POST', url, 'enrollment:', e)
          await api.post(url, {})
          onRefresh()
        } catch (err: any) {
          console.error('[deleteEnrollment] error:', err.response?.status, err.response?.data)
          alert('Lỗi: ' + (err.response?.data?.message ?? err.message ?? 'Không thể xoá') + '\nURL: /students/' + student.id + '/enroll/' + e.id)
        }
      },
    })
  }

  const dropEnrollment = (e: ClassEnrollment) => {
    setConfirm({
      message: `Cho học viên nghỉ lớp "${e.className}"?`,
      onConfirm: async () => {
        setConfirm(null)
        await api.put(`/students/${student.id}/enroll/${e.id}/drop`, {})
        onRefresh()
      },
    })
  }

  const deleteParent = (p: Parent & { id: string }) => {
    setConfirm({
      message: `Xoá thông tin phụ huynh "${p.fullName}"?`,
      onConfirm: async () => {
        setConfirm(null)
        await api.delete(`/parents/${student.id}/${p.id}`)
        onRefresh()
      },
    })
  }

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE')
  const droppedEnrollments = enrollments.filter(e => e.status === 'DROPPED')

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Basic info */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-outline-variant/10 pb-4">
            <h3 className="font-headline text-lg font-bold text-on-surface">Thông tin cơ bản</h3>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <span className="material-symbols-outlined text-base">edit</span>Chỉnh sửa
            </button>
          </div>
          <div className="space-y-5">
            <InfoRow label="Ngày sinh" value={fmt(student.dateOfBirth)} />
            <InfoRow label="Giới tính" value={student.gender === 'MALE' ? 'Nam' : student.gender === 'FEMALE' ? 'Nữ' : null} />
            <InfoRow label="Trường học" value={student.school} />
            <InfoRow label="Địa chỉ" value={student.address} />
            <InfoRow label="Ngày nhập học" value={fmt(student.enrollmentDate)} />
            {student.notes && <InfoRow label="Ghi chú" value={student.notes} />}
          </div>

          {/* Status actions */}
          <div className="mt-6 pt-5 border-t border-outline-variant/10 flex flex-col gap-2">
            {student.status !== 'ACTIVE' && (
              <button
                onClick={() => onStatusChange('ACTIVE')}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-secondary hover:bg-secondary-container/20 transition-colors"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                Kích hoạt đang học
              </button>
            )}
            {student.status !== 'RESERVED' && (
              <button
                onClick={() => onStatusChange('RESERVED')}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-outline hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-base">pause_circle</span>
                Bảo lưu
              </button>
            )}
            {student.status !== 'INACTIVE' && (
              <button
                onClick={() => onStatusChange('INACTIVE')}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-error hover:bg-error-container/10 transition-colors"
              >
                <span className="material-symbols-outlined text-base">cancel</span>
                Cho nghỉ học
              </button>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="md:col-span-8 space-y-6">
          {/* Parents */}
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-outline-variant/10 pb-4">
              <h3 className="font-headline text-lg font-bold text-on-surface">Phụ huynh / Liên hệ</h3>
              <button
                onClick={() => setParentModal({ open: true, parent: null })}
                className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <span className="material-symbols-outlined text-base">add</span>Thêm
              </button>
            </div>
            {parents.length === 0 ? (
              <p className="text-sm text-outline">Chưa có thông tin phụ huynh</p>
            ) : (
              <div className="space-y-3">
                {parents.map(p => (
                  <div key={p.id} className="p-4 bg-surface-container-low rounded-xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {p.fullName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-on-surface">{p.fullName}</p>
                        {p.isPrimaryContact && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Liên hệ chính</span>
                        )}
                      </div>
                      <p className="text-sm text-outline mt-0.5">{p.relationship}</p>
                      <div className="flex gap-4 mt-2 flex-wrap">
                        {p.phone && (
                          <a href={`tel:${p.phone}`} className="text-sm text-on-surface-variant flex items-center gap-1 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">phone</span>{p.phone}
                          </a>
                        )}
                        {p.zalo && (
                          <p className="text-sm text-blue-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">chat</span>Zalo: {p.zalo}
                          </p>
                        )}
                        {p.email && (
                          <a href={`mailto:${p.email}`} className="text-sm text-on-surface-variant flex items-center gap-1 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">mail</span>{p.email}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setParentModal({ open: true, parent: p })}
                        className="p-1.5 rounded-lg hover:bg-surface-container-highest text-outline hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => deleteParent(p)}
                        className="p-1.5 rounded-lg hover:bg-error-container/20 text-outline hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enrollments */}
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-outline-variant/10 pb-4">
              <h3 className="font-headline text-lg font-bold text-on-surface">Lớp học</h3>
              <button
                onClick={() => setEnrollModal(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <span className="material-symbols-outlined text-base">add</span>Đăng ký lớp
              </button>
            </div>
            {activeEnrollments.length === 0 ? (
              <p className="text-sm text-outline">Chưa đăng ký lớp nào</p>
            ) : (
              <div className="space-y-2 mb-4">
                {activeEnrollments.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                    <div>
                      <p className="font-semibold text-on-surface text-sm">{e.className}</p>
                      <p className="text-xs text-outline">Ngày đăng ký: {fmt(e.enrollmentDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-secondary-container/30 text-secondary px-2 py-1 rounded-full font-bold">Đang học</span>
                      <button
                        onClick={() => dropEnrollment(e)}
                        className="p-1.5 rounded-lg hover:bg-error-container/20 text-outline hover:text-error transition-colors"
                        title="Cho nghỉ lớp"
                      >
                        <span className="material-symbols-outlined text-base">person_remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {droppedEnrollments.length > 0 && (
              <details className="group">
                <summary className="text-xs text-outline cursor-pointer select-none hover:text-on-surface transition-colors">
                  Đã nghỉ ({droppedEnrollments.length} lớp)
                </summary>
                <div className="space-y-2 mt-2">
                  {droppedEnrollments.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-3 bg-surface-container-low/50 rounded-xl opacity-60 hover:opacity-80 transition-opacity">
                      <div>
                        <p className="font-semibold text-on-surface text-sm line-through">{e.className}</p>
                        <p className="text-xs text-outline">Đăng ký: {fmt(e.enrollmentDate)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-surface-container-high text-outline px-2 py-1 rounded-full font-bold">Đã nghỉ</span>
                        <button
                          onClick={() => deleteEnrollment(e)}
                          className="p-1 hover:bg-error/10 hover:text-error text-outline rounded-lg transition-colors"
                          title="Xoá khỏi lịch học"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {parentModal.open && (
        <ParentModal
          studentId={student.id}
          parent={parentModal.parent}
          onClose={() => setParentModal({ open: false, parent: null })}
          onSaved={() => { setParentModal({ open: false, parent: null }); onRefresh() }}
        />
      )}
      {enrollModal && (
        <EnrollModal
          studentId={student.id}
          onClose={() => setEnrollModal(false)}
          onSaved={() => { setEnrollModal(false); onRefresh() }}
        />
      )}
      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </>
  )
}

// ─── Tab: Attendance ─────────────────────────────────────────────────────────

function AttendanceTab({ studentId }: { studentId: string }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [attendances, setAttendances] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/students/${studentId}/attendance`, { params: { month, year } })
      .then(r => setAttendances(r.data))
      .catch(() => setAttendances([]))
      .finally(() => setLoading(false))
  }, [studentId, month, year])

  const present = attendances.filter(a => a.status === 'PRESENT').length
  const absent = attendances.filter(a => a.status === 'ABSENT').length
  const excused = attendances.filter(a => a.status === 'EXCUSED').length

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input py-2 w-32">
            {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input py-2 w-28">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {attendances.length > 0 && (
          <div className="flex gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-secondary font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary inline-block" />{present} có mặt
            </span>
            <span className="flex items-center gap-1.5 text-error font-medium">
              <span className="w-2 h-2 rounded-full bg-error inline-block" />{absent} vắng
            </span>
            {excused > 0 && (
              <span className="flex items-center gap-1.5 text-outline font-medium">
                <span className="w-2 h-2 rounded-full bg-outline inline-block" />{excused} phép
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : attendances.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-outline/40 block mb-2">event_busy</span>
            <p className="text-sm text-outline">Không có dữ liệu điểm danh tháng {month}/{year}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attendances.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold leading-tight">{a.sessionDate?.slice(8, 10)}/{a.sessionDate?.slice(5, 7)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">{a.className}</p>
                    {a.startTime && a.endTime && (
                      <p className="text-xs text-outline">{a.startTime} – {a.endTime}</p>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  a.status === 'PRESENT' ? 'bg-secondary-container/30 text-secondary'
                  : a.status === 'ABSENT' ? 'bg-error-container/10 text-error'
                  : 'bg-surface-container-high text-outline'
                }`}>
                  {a.status === 'PRESENT' ? 'Có mặt' : a.status === 'ABSENT' ? 'Vắng' : 'Vắng phép'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Tuition ────────────────────────────────────────────────────────────

interface TuitionRow {
  monthKey: string; month: number; year: number
  classId: string; className: string
  totalSessions: number; ratePerSession: number
  discountAmount: number; baseAmount: number; finalAmount: number
}

interface PromoModalProps {
  studentId: string
  enrollments: ClassEnrollment[]
  hasPrivate: boolean
  onClose: () => void
  onSaved: () => void
}

function PromoModal({ studentId, enrollments, hasPrivate, onClose, onSaved }: PromoModalProps) {
  const today = new Date()
  const defaultFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const allOptions = [
    ...enrollments.map(e => ({ classId: e.classId, className: e.className })),
    ...(hasPrivate ? [{ classId: 'private', className: 'Học riêng' }] : []),
  ]
  const [classId, setClassId] = useState(allOptions[0]?.classId ?? '')
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE')
  const [value, setValue] = useState('')
  const [appliedFrom, setAppliedFrom] = useState(defaultFrom)  // "YYYY-MM"
  const [appliedTo, setAppliedTo] = useState('')               // "YYYY-MM" or empty
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId || !value) { setError('Vui lòng điền đầy đủ thông tin'); return }
    setSaving(true); setError('')
    // Convert month "YYYY-MM" → first/last day of month for date range
    const fromDate = appliedFrom ? `${appliedFrom}-01` : undefined
    const toDate = appliedTo
      ? (() => { const [y, m] = appliedTo.split('-'); return `${y}-${m}-${new Date(+y, +m, 0).getDate()}` })()
      : undefined
    try {
      await api.post('/tuition/student-promotions/direct', {
        studentId, classId, type, value: Number(value),
        appliedFrom: fromDate, appliedTo: toDate,
      })
      onSaved()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  if (allOptions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-8 z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-headline font-bold text-on-surface">Thêm khuyến mại</h3>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <p className="text-sm text-outline py-4">Học viên chưa có lớp học hoặc lịch học riêng nào.</p>
          <button onClick={onClose} className="w-full btn-secondary justify-center">Đóng</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-8 z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-headline font-bold text-on-surface">Thêm khuyến mại</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {error && <div className="mb-4 p-3 bg-error-container/10 text-error rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">Lớp học</label>
            <select value={classId} onChange={e => setClassId(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              {allOptions.map(o => (
                <option key={o.classId} value={o.classId}>{o.className}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">Loại giảm giá</label>
            <div className="flex gap-3">
              {[{ v: 'PERCENTAGE', label: 'Giảm %' }, { v: 'FIXED_AMOUNT', label: 'Giảm tiền' }].map(opt => (
                <button key={opt.v} type="button"
                  onClick={() => setType(opt.v as 'PERCENTAGE' | 'FIXED_AMOUNT')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                    type === opt.v ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-on-surface-variant border-transparent'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">
              {type === 'PERCENTAGE' ? 'Tỷ lệ giảm (%)' : 'Số tiền giảm (đ)'}
            </label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)} required
              min={1} max={type === 'PERCENTAGE' ? 100 : undefined}
              placeholder={type === 'PERCENTAGE' ? 'Ví dụ: 10' : 'Ví dụ: 200000'}
              className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">Từ tháng</label>
              <input type="month" value={appliedFrom} onChange={e => setAppliedFrom(e.target.value)} required
                className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">Đến tháng <span className="text-outline/50 font-normal normal-case">(trống = không giới hạn)</span></label>
              <input type="month" value={appliedTo} onChange={e => setAppliedTo(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary justify-center">Huỷ</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary justify-center disabled:opacity-60">
              {saving ? 'Đang lưu...' : 'Thêm khuyến mại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TuitionTab({ studentId, enrollments }: { studentId: string; enrollments: ClassEnrollment[] }) {
  const now = new Date()
  const [rows, setRows] = useState<TuitionRow[]>([])
  const [promos, setPromos] = useState<StudentPromotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear, setFilterYear] = useState(now.getFullYear())

  const loadRows = () => api.get(`/students/${studentId}/tuition-summary`)
    .then(r => setRows(r.data ?? [])).catch(() => setRows([]))

  const loadPromos = () => api.get(`/tuition/student-promotions?studentId=${studentId}`)
    .then(r => setPromos(r.data ?? [])).catch(() => setPromos([]))

  const load = () => {
    setLoading(true)
    Promise.all([loadRows(), loadPromos()]).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [studentId])

  const deletePromo = async (id: string) => {
    if (!confirm('Xoá khuyến mại này?')) return
    await api.delete(`/tuition/student-promotions/${id}`)
    load()
  }

  const filteredRows = rows.filter(r => r.month === filterMonth && r.year === filterYear)
  const totalFee = filteredRows.reduce((s, r) => s + r.finalAmount, 0)
  const totalDiscount = filteredRows.reduce((s, r) => s + r.discountAmount, 0)
  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE')
  const availableYears = [...new Set(rows.map(r => r.year))].sort((a, b) => b - a)

  const promoTypeBadge = (type: string) => {
    if (type === 'PERCENTAGE') return <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">%</span>
    if (type === 'FIXED_AMOUNT') return <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold">đ</span>
    return null
  }

  return (
    <div className="space-y-4">
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold text-outline tracking-wider mb-1">Tổng học phí</p>
            <p className="text-xl font-bold text-on-surface">{fmtMoney(totalFee)}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold text-outline tracking-wider mb-1">Tổng buổi</p>
            <p className="text-xl font-bold text-primary">{filteredRows.reduce((s, r) => s + r.totalSessions, 0)}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold text-outline tracking-wider mb-1">Tổng giảm giá</p>
            <p className="text-xl font-bold text-secondary">{fmtMoney(totalDiscount)}</p>
          </div>
        </div>
      )}

      {/* Promotions section */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-base font-bold text-on-surface">Khuyến mại đang áp dụng</h3>
          <button onClick={() => setShowPromoModal(true)} className="btn-primary text-xs py-1.5 px-3">
            <span className="material-symbols-outlined text-sm">add</span>
            Thêm khuyến mại
          </button>
        </div>
        {promos.length === 0 ? (
          <p className="text-sm text-outline py-2">Chưa có khuyến mại nào</p>
        ) : (
          <div className="space-y-2">
            {promos.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {promoTypeBadge(p.promotionType)}
                  <span className="text-sm font-semibold text-on-surface">
                    {p.promotionType === 'PERCENTAGE' ? `${p.promotionValue}%` : fmtMoney(p.promotionValue)}
                  </span>
                  <span className="text-sm text-outline">·</span>
                  <span className="text-sm text-on-surface-variant truncate">{p.className}</span>
                  <span className="text-xs text-outline whitespace-nowrap">
                    {fmt(p.appliedFrom)} → {p.appliedTo ? fmt(p.appliedTo) : 'Không giới hạn'}
                  </span>
                </div>
                <button onClick={() => deletePromo(p.id)}
                  className="p-1.5 hover:bg-error/10 text-outline hover:text-error rounded-lg transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline text-lg font-bold text-on-surface">Học phí cá nhân</h3>
          <div className="flex items-center gap-2">
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(Number(e.target.value))}
              className="bg-surface-container-low border border-outline-variant/20 rounded-xl py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={e => setFilterYear(Number(e.target.value))}
              className="bg-surface-container-low border border-outline-variant/20 rounded-xl py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {(availableYears.length > 0 ? availableYears : [now.getFullYear()]).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-outline/40 block mb-2">receipt_long</span>
            <p className="text-sm text-outline">Chưa có dữ liệu lịch học</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-outline/40 block mb-2">event_busy</span>
            <p className="text-sm text-outline">Không có dữ liệu tháng {filterMonth}/{filterYear}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/10 text-[10px] uppercase font-bold text-outline tracking-widest">
                  <th className="pb-3 pr-6">Lớp học</th>
                  <th className="pb-3 pr-6 text-center">Số buổi học</th>
                  <th className="pb-3 pr-6 text-right">Học phí/buổi</th>
                  <th className="pb-3 pr-6 text-right">Khuyến mại & Giảm giá</th>
                  <th className="pb-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {filteredRows.map(r => (
                  <tr key={`${r.monthKey}__${r.classId}`} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-3 pr-6 text-sm">{r.className}</td>
                    <td className="py-3 pr-6 text-sm text-center font-semibold">{r.totalSessions}</td>
                    <td className="py-3 pr-6 text-sm text-right">{r.ratePerSession ? fmtMoney(r.ratePerSession) : '—'}</td>
                    <td className="py-3 pr-6 text-sm text-right">
                      {r.discountAmount > 0
                        ? <span className="text-secondary font-medium">-{fmtMoney(r.discountAmount)}</span>
                        : <span className="text-outline">—</span>}
                    </td>
                    <td className="py-3 text-sm font-bold text-right">{fmtMoney(r.finalAmount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-outline-variant/20">
                  <td colSpan={4} className="pt-3 text-sm font-bold text-outline uppercase tracking-wider">Tổng cộng</td>
                  <td className="pt-3 text-sm font-bold text-right text-primary">{fmtMoney(totalFee)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {showPromoModal && (
        <PromoModal
          studentId={studentId}
          enrollments={activeEnrollments}
          hasPrivate={rows.some(r => r.classId === 'private')}
          onClose={() => setShowPromoModal(false)}
          onSaved={() => { setShowPromoModal(false); load() }}
        />
      )}
    </div>
  )
}

// ─── Tab: Schedule ───────────────────────────────────────────────────────────

const DAY_NAMES: Record<string, string> = {
  '1': 'Thứ 2', '2': 'Thứ 3', '3': 'Thứ 4', '4': 'Thứ 5',
  '5': 'Thứ 6', '6': 'Thứ 7', '0': 'Chủ nhật',
}
const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function dayOfWeek(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_NAMES[String(d.getDay())] ?? '—'
}

// ─── Private Schedule Modal ────────────────────────────────────────
export interface PrivateScheduleModalProps {
  studentId: string
  studentName: string
  onClose: () => void
  onSaved: () => void
}

export function PrivateScheduleModal({ studentId, studentName, onClose, onSaved }: PrivateScheduleModalProps) {
  const today = new Date()
  const [mode, setMode] = React.useState<'manual' | 'repeat'>('manual')
  // Manual mode
  const [calYear, setCalYear] = React.useState(today.getFullYear())
  const [calMonth, setCalMonth] = React.useState(today.getMonth()) // 0-based
  const [selectedDates, setSelectedDates] = React.useState<Set<string>>(new Set())
  const [existingDates, setExistingDates] = React.useState<Set<string>>(new Set())

  // Fetch all existing private sessions once on mount
  React.useEffect(() => {
    api.get(`/students/${studentId}/private-schedule`)
      .then(r => {
        const dates = new Set<string>((r.data ?? []).map((s: any) => s.sessionDate as string))
        setExistingDates(dates)
      })
      .catch(() => {})
  }, [studentId])
  // Repeat mode
  const [weekdays, setWeekdays] = React.useState<Set<number>>(new Set())
  const [fromMonth, setFromMonth] = React.useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)
  const [toMonth, setToMonth] = React.useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)
  // Common
  const [startTime, setStartTime] = React.useState('')
  const [endTime, setEndTime] = React.useState('')
  const [rate, setRate] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  const toggleDate = (d: string) => setSelectedDates(prev => {
    const s = new Set(prev); s.has(d) ? s.delete(d) : s.add(d); return s
  })

  const toggleWeekday = (d: number) => setWeekdays(prev => {
    const s = new Set(prev); s.has(d) ? s.delete(d) : s.add(d); return s
  })

  // Generate dates for repeat mode
  const repeatDates = React.useMemo(() => {
    if (mode !== 'repeat' || weekdays.size === 0 || !fromMonth || !toMonth) return []
    const [fy, fm] = fromMonth.split('-').map(Number)
    const [ty, tm] = toMonth.split('-').map(Number)
    const start = new Date(fy, fm - 1, 1)
    const end = new Date(ty, tm, 0) // last day of toMonth
    const dates: string[] = []
    const cur = new Date(start)
    while (cur <= end) {
      if (weekdays.has(cur.getDay())) {
        dates.push(cur.toISOString().slice(0, 10))
      }
      cur.setDate(cur.getDate() + 1)
    }
    return dates
  }, [mode, weekdays, fromMonth, toMonth])

  const finalDates = mode === 'manual' ? [...selectedDates].sort() : repeatDates

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) } else setCalMonth(m => m - 1) }
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) } else setCalMonth(m => m + 1) }

  // Build calendar grid
  const calDays = React.useMemo(() => {
    const first = new Date(calYear, calMonth, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const cells: (number | null)[] = Array(first).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [calYear, calMonth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (finalDates.length === 0) { setError('Chọn ít nhất 1 ngày học'); return }
    if (!rate) { setError('Nhập học phí mỗi buổi'); return }
    setSaving(true); setError('')
    try {
      await api.post(`/students/${studentId}/private-schedule`, {
        sessions: finalDates.map(d => ({
          sessionDate: d,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          ratePerSession: Number(rate),
        }))
      })
      onSaved()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-headline font-bold text-on-surface">Thêm lịch học: {studentName}</h3>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {error && <div className="mb-4 p-3 bg-error-container/10 text-error rounded-xl text-sm">{error}</div>}

          {/* Mode toggle */}
          <div className="mb-5">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-2">Chế độ lên lịch</label>
            <div className="flex gap-2">
              {[{ v: 'manual', icon: 'calendar_month', label: 'Chọn thủ công' }, { v: 'repeat', icon: 'repeat', label: 'Lặp lại tự động' }].map(opt => (
                <button key={opt.v} type="button" onClick={() => setMode(opt.v as 'manual' | 'repeat')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium border transition-all ${mode === opt.v ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-on-surface-variant border-transparent'}`}>
                  <span className="material-symbols-outlined text-base">{opt.icon}</span>{opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-5">
          {mode === 'manual' ? (
            <div>
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-2">Chọn các ngày học</label>
              {/* Calendar */}
              <div className="bg-surface-container-low rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={prevMonth} className="p-1 hover:bg-surface-container rounded-lg"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                  <span className="text-sm font-bold text-on-surface">{monthNames[calMonth]}, {calYear}</span>
                  <button type="button" onClick={nextMonth} className="p-1 hover:bg-surface-container rounded-lg"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEKDAY_LABELS.map(d => <div key={d} className="text-center text-[10px] font-bold text-outline py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calDays.map((day, i) => {
                    if (!day) return <div key={i} />
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const isSelected = selectedDates.has(dateStr)
                    const isExisting = existingDates.has(dateStr)
                    const isToday = dateStr === today.toISOString().slice(0, 10)
                    return (
                      <button key={i} type="button" onClick={() => toggleDate(dateStr)}
                        title={isExisting ? 'Đã có lịch học' : undefined}
                        className={`aspect-square rounded-full text-sm flex items-center justify-center transition-all font-medium relative ${
                          isSelected ? 'bg-primary text-on-primary' :
                          isExisting ? 'bg-tertiary/20 text-tertiary ring-1 ring-tertiary/50' :
                          isToday ? 'border-2 border-primary text-primary' :
                          'hover:bg-surface-container text-on-surface'
                        }`}>
                        {day}
                        {isExisting && !isSelected && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-tertiary" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              {existingDates.size > 0 && (
                <div className="flex items-center gap-3 mt-2 text-[11px] text-outline">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-tertiary/20 ring-1 ring-tertiary/50 inline-block" /> Đã có lịch</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> Đang chọn</span>
                </div>
              )}
              {selectedDates.size > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {[...selectedDates].sort().map(d => (
                    <span key={d} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      <span className="material-symbols-outlined text-xs">calendar_today</span>
                      {fmt(d)}
                      <button type="button" onClick={() => toggleDate(d)} className="hover:text-error ml-0.5">
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-2">Chọn thứ trong tuần</label>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6,0].map(wd => (
                    <button key={wd} type="button" onClick={() => toggleWeekday(wd)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${weekdays.has(wd) ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-on-surface-variant border-transparent hover:border-primary/30'}`}>
                      {WEEKDAY_LABELS[wd]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">Từ tháng</label>
                  <input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">Đến tháng</label>
                  <input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              {repeatDates.length > 0 && (
                <p className="text-sm text-primary font-semibold">Sẽ tạo {repeatDates.length} buổi học</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">Giờ bắt đầu</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">Giờ kết thúc</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">Học phí mỗi buổi (đ)</label>
            <input type="number" value={rate} onChange={e => setRate(e.target.value)} required min={0}
              placeholder="Ví dụ: 200000"
              className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary justify-center">Huỷ</button>
            <button type="submit" disabled={saving || finalDates.length === 0}
              className="flex-1 btn-primary justify-center disabled:opacity-60">
              {saving ? 'Đang lưu...' : `Lưu ${finalDates.length} buổi học`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Private Tab ───────────────────────────────────────────────────
function PrivateTab({ studentId, studentName }: { studentId: string; studentName: string }) {
  const today = new Date()
  const [month, setMonth] = React.useState(today.getMonth() + 1)
  const [year, setYear] = React.useState(today.getFullYear())
  const [sessions, setSessions] = React.useState<PrivateSession[]>([])
  const [loading, setLoading] = React.useState(false)
  const [showModal, setShowModal] = React.useState(false)

  const load = () => {
    setLoading(true)
    api.get(`/students/${studentId}/private-schedule`, { params: { month, year } })
      .then(r => setSessions(r.data ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }

  React.useEffect(() => { load() }, [studentId, month, year])

  const deleteSession = async (id: string) => {
    if (!confirm('Xoá buổi học này?')) return
    await api.delete(`/students/${studentId}/private-schedule/${id}`)
    load()
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years  = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]
  const totalFee = sessions.filter(s => s.status !== 'CANCELLED').reduce((sum, s) => sum + (s.ratePerSession || 0), 0)

  const statusCfg: Record<string, { label: string; cls: string }> = {
    SCHEDULED: { label: 'Sắp học',  cls: 'bg-primary/10 text-primary' },
    COMPLETED: { label: 'Đã học',   cls: 'bg-secondary-container/40 text-secondary' },
    CANCELLED: { label: 'Đã huỷ',  cls: 'bg-error-container/20 text-error' },
  }
  const resolvePrivateStatus = (s: any) => {
    if (s.status === 'CANCELLED') return 'CANCELLED'
    const end = s.endTime ?? s.startTime
    const dt = end ? new Date(`${s.sessionDate}T${end}`) : new Date(`${s.sessionDate}T23:59`)
    return dt <= new Date() ? 'COMPLETED' : 'SCHEDULED'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input py-2 w-32">
            {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input py-2 w-28">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4">
          {sessions.length > 0 && (
            <span className="text-sm font-bold text-on-surface">
              {sessions.length} buổi · <span className="text-primary">{fmtMoney(totalFee)}</span>
            </span>
          )}
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
            <span className="material-symbols-outlined text-base">add</span>
            Thêm lịch học riêng
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-outline/30 block mb-3">person</span>
            <p className="text-sm text-outline">Chưa có lịch học riêng tháng {month}/{year}</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-low/50">
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-outline tracking-widest w-24">Thứ</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-outline tracking-widest w-36">Ngày học</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-outline tracking-widest">Loại</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-outline tracking-widest">Giáo viên</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-outline tracking-widest text-right">Học phí buổi</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-outline tracking-widest">Trạng thái</th>
                <th className="px-6 py-4 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {sessions.map(s => {
                const cfg = statusCfg[resolvePrivateStatus(s)] ?? { label: s.status, cls: 'bg-surface-container-high text-outline' }
                return (
                  <tr key={s.id} className="hover:bg-surface-container-low/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-on-surface-variant">{dayOfWeek(s.sessionDate)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-on-surface">{fmt(s.sessionDate)}</p>
                        {s.startTime && s.endTime && (
                          <p className="text-xs text-outline mt-0.5">{s.startTime} – {s.endTime}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-on-surface">Học riêng</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-on-surface-variant">{(s as any).teacherName || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-on-surface">
                        {s.ratePerSession ? fmtMoney(s.ratePerSession) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${cfg.cls}`}>{cfg.label}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => deleteSession(s.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-error/10 text-outline hover:text-error rounded-lg transition-all">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {totalFee > 0 && (
              <tfoot>
                <tr className="border-t border-outline-variant/10 bg-surface-container-low/30">
                  <td colSpan={4} className="px-6 py-3 text-xs text-outline">* Học phí tính cho các buổi chưa huỷ</td>
                  <td className="px-6 py-3 text-right"><span className="text-sm font-extrabold text-primary">{fmtMoney(totalFee)}</span></td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {showModal && (
        <PrivateScheduleModal
          studentId={studentId}
          studentName={studentName}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}

function ScheduleTab({ studentId }: { studentId: string }) {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear]   = useState(today.getFullYear())
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/students/${studentId}/schedule`, { params: { month, year } })
      .then(r => setSessions(r.data ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [studentId, month, year])

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years  = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]

  const totalFee = sessions
    .filter(s => s.status !== 'CANCELLED')
    .reduce((sum: number, s: any) => sum + (s.ratePerSession || 0), 0)

  const sessionStatusCfg: Record<string, { label: string; cls: string }> = {
    SCHEDULED:  { label: 'Sắp học',   cls: 'bg-primary/10 text-primary' },
    COMPLETED:  { label: 'Đã học',    cls: 'bg-secondary-container/40 text-secondary' },
    CANCELLED:  { label: 'Đã huỷ',   cls: 'bg-error-container/20 text-error' },
    MAKEUP:     { label: 'Học bù',    cls: 'bg-tertiary-container/40 text-on-tertiary-container' },
  }
  const resolveSessionStatus = (s: any) => {
    if (s.status === 'CANCELLED') return 'CANCELLED'
    if (s.status === 'MAKEUP') return 'MAKEUP'
    const end = s.endTime ?? s.startTime
    const dt = end ? new Date(`${s.sessionDate}T${end}`) : new Date(`${s.sessionDate}T23:59`)
    return dt <= new Date() ? 'COMPLETED' : 'SCHEDULED'
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input py-2 w-32">
            {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input py-2 w-28">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {sessions.length > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="text-outline">{sessions.length} buổi</span>
            <span className="font-bold text-on-surface">
              Dự kiến: <span className="text-primary">{fmtMoney(totalFee)}</span>
            </span>
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-outline/30 block mb-3">calendar_month</span>
            <p className="text-sm text-outline">Không có lịch học tháng {month}/{year}</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-low/50">
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-outline tracking-widest w-24">Thứ</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-outline tracking-widest w-36">Ngày học</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-outline tracking-widest">Lớp học</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-outline tracking-widest">Giáo viên</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-outline tracking-widest text-right">Học phí buổi</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-outline tracking-widest">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {sessions.map((s: any) => {
                const cfg = sessionStatusCfg[resolveSessionStatus(s)] ?? { label: s.status, cls: 'bg-surface-container-high text-outline' }
                const isCancelled = s.status === 'CANCELLED'
                return (
                  <tr key={s.id} className={`hover:bg-surface-container-low/30 transition-colors ${isCancelled ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-on-surface-variant">{dayOfWeek(s.sessionDate)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-on-surface">{fmt(s.sessionDate)}</p>
                        {s.startTime && s.endTime && (
                          <p className="text-xs text-outline mt-0.5">{s.startTime} – {s.endTime}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-on-surface">{s.className}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                          {s.teacherName?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className="text-sm text-on-surface-variant">{(s as any).teacherName || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${isCancelled ? 'line-through text-outline' : 'text-on-surface'}`}>
                        {s.ratePerSession ? fmtMoney(s.ratePerSession) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {totalFee > 0 && (
              <tfoot>
                <tr className="border-t border-outline-variant/10 bg-surface-container-low/30">
                  <td colSpan={4} className="px-6 py-3 text-xs text-outline">
                    * Học phí tính cho các buổi chưa huỷ
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-sm font-extrabold text-primary">{fmtMoney(totalFee)}</span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  )
}

// ─── More Actions Menu ───────────────────────────────────────────────────────

function MoreMenu({ student, onUpdated }: { student: Student & { id: string }; onUpdated: (s: Student) => void }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const changeStatus = (status: 'ACTIVE' | 'INACTIVE' | 'RESERVED') => {
    const labels = { ACTIVE: 'Đang học', INACTIVE: 'Đã nghỉ', RESERVED: 'Bảo lưu' }
    setOpen(false)
    setConfirm({
      message: `Chuyển trạng thái học viên sang "${labels[status]}"?`,
      onConfirm: async () => {
        setConfirm(null)
        const res = await api.put(`/students/${student.id}`, { status })
        onUpdated({ ...student, status })
      },
    })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2.5 bg-surface-container-lowest text-on-surface-variant border border-outline-variant/15 rounded-xl hover:bg-surface-container-low transition-all"
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/10 py-2 z-20">
          {student.status !== 'ACTIVE' && (
            <button onClick={() => changeStatus('ACTIVE')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container-low flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-base">check_circle</span>Chuyển sang Đang học
            </button>
          )}
          {student.status !== 'RESERVED' && (
            <button onClick={() => changeStatus('RESERVED')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container-low flex items-center gap-2 text-outline">
              <span className="material-symbols-outlined text-base">pause_circle</span>Bảo lưu
            </button>
          )}
          {student.status !== 'INACTIVE' && (
            <button onClick={() => changeStatus('INACTIVE')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container-low flex items-center gap-2 text-error">
              <span className="material-symbols-outlined text-base">cancel</span>Cho nghỉ học
            </button>
          )}
        </div>
      )}
      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'schedule' | 'private' | 'tuition'>('info')
  const [editModal, setEditModal] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    api.get(`/students/${id}`)
      .then(r => setStudent(r.data))
      .catch(() => setStudent(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  if (loading) return (
    <div className="flex-1 ml-64 flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  )

  if (!student) return (
    <div>
      <TopBar title="Hồ sơ học viên" />
      <div className="p-8 text-center">
        <span className="material-symbols-outlined text-5xl text-outline/40 block mb-3">person_off</span>
        <p className="text-outline">Không tìm thấy học viên</p>
        <button onClick={() => navigate('/students')} className="mt-4 btn-primary">
          <span className="material-symbols-outlined text-lg">arrow_back</span>Quay lại
        </button>
      </div>
    </div>
  )

  const enrollments: ClassEnrollment[] = student.enrollments ?? []
  const parents: (Parent & { id: string })[] = student.parents ?? []

  const statusConfig: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: 'Đang học', cls: 'bg-secondary text-on-secondary' },
    INACTIVE: { label: 'Đã nghỉ', cls: 'bg-error text-on-error' },
    RESERVED: { label: 'Bảo lưu', cls: 'bg-surface-container-high text-outline' },
  }
  const statusInfo = statusConfig[student.status] ?? statusConfig.INACTIVE

  return (
    <div>
      <TopBar title="Hồ sơ học viên" />
      <div className="p-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-outline">
          <button onClick={() => navigate('/students')} className="hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>Học viên
          </button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-surface font-medium">{student.fullName}</span>
        </div>

        {/* Header */}
        <section className="flex flex-col md:flex-row gap-8 items-start">
          <div className="relative flex-shrink-0">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-primary-container p-1 shadow-lg shadow-primary/20">
              <div className="w-full h-full rounded-[14px] bg-surface-container-highest flex items-center justify-center">
                <span className="text-4xl font-black text-primary">
                  {student.fullName.split(' ').slice(-1)[0]?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
            </div>
            <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm ${statusInfo.cls}`}>
              {statusInfo.label}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">{student.fullName}</h2>
              <p className="text-on-surface-variant font-medium flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-sm">id_card</span>
                {student.id.slice(0, 8).toUpperCase()}
                {student.enrollmentDate && (
                  <span className="text-outline text-xs">· Nhập học {fmt(student.enrollmentDate)}</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {student.gradeLevel && (
                <span className="px-4 py-1.5 bg-surface-container-highest text-on-primary-container rounded-lg text-sm font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">school</span>Lớp {student.gradeLevel}
                </span>
              )}
              {enrollments.filter(e => e.status === 'ACTIVE').map(e => (
                <span key={e.id} className="px-4 py-1.5 bg-secondary-container/30 text-on-secondary-container rounded-lg text-sm font-semibold">
                  {e.className}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-outline-variant/20">
          {(['info', 'schedule', 'private', 'tuition'] as const).map(tab => {
            const icons  = { info: 'person', schedule: 'calendar_month', private: 'person_apron', tuition: 'payments' }
            const labels = { info: 'Thông tin', schedule: 'Lịch học', private: 'Học riêng', tuition: 'Học phí' }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined text-base">{icons[tab]}</span>
                {labels[tab]}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'info' && (
          <InfoTab
            student={student}
            parents={parents}
            enrollments={enrollments}
            onRefresh={load}
            onEdit={() => setEditModal(true)}
            onStatusChange={async (status) => {
              const labels = { ACTIVE: 'Đang học', INACTIVE: 'Đã nghỉ', RESERVED: 'Bảo lưu' }
              if (!window.confirm(`Chuyển trạng thái sang "${labels[status]}"?`)) return
              await api.put(`/students/${student.id}`, { status })
              setStudent((prev: any) => ({ ...prev, status }))
            }}
          />
        )}
        {activeTab === 'schedule' && (
          <ScheduleTab studentId={id!} />
        )}
        {activeTab === 'private' && (
          <PrivateTab studentId={id!} studentName={student?.fullName ?? ''} />
        )}
{activeTab === 'tuition' && (
          <TuitionTab studentId={id!} enrollments={enrollments} />
        )}
      </div>

      {/* Edit modal */}
      {editModal && (
        <EditStudentModal
          student={student}
          onClose={() => setEditModal(false)}
          onSaved={updated => { setStudent((prev: any) => ({ ...prev, ...updated })); setEditModal(false) }}
        />
      )}
    </div>
  )
}
