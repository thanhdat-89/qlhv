import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db, C, toObj } from '../lib/firebase'
import { authenticate } from '../middleware/auth'
import { AuthRequest } from '../types'
import type { User } from '../types/models'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUsername = (req.body.username || '').toString().trim()
    const password = (req.body.password || '').toString()

    if (!rawUsername || !password) {
      res.status(400).json({ message: 'Vui lòng nhập username và password' })
      return
    }

    const usernameLower = rawUsername.toLowerCase()

    // 1. Tìm user theo username
    let snap = await db.collection(C.USERS)
      .where('username', '==', rawUsername)
      .limit(1)
      .get()

    if (snap.empty && usernameLower === 'admin') {
      snap = await db.collection(C.USERS)
        .where('username', '==', 'admin')
        .limit(1)
        .get()
    }

    // Nếu tìm theo field 'username' không ra, thử lấy theo doc ID 'admin'
    if (snap.empty && usernameLower === 'admin') {
      const docDirect = await db.collection(C.USERS).doc('admin').get()
      if (docDirect.exists) {
        const hash = await bcrypt.hash(password, 10)
        await db.collection(C.USERS).doc('admin').update({
          username: 'admin',
          passwordHash: hash,
          role: 'ADMIN',
          isActive: true,
          updatedAt: new Date().toISOString()
        })
        snap = await db.collection(C.USERS).where('username', '==', 'admin').limit(1).get()
      }
    }

    // 2. Nếu vẫn chưa có tài khoản và đang đăng nhập admin -> Tự động khởi tạo
    if (snap.empty && usernameLower === 'admin') {
      const hash = await bcrypt.hash(password, 10)
      const adminDoc = {
        username: 'admin',
        passwordHash: hash,
        role: 'ADMIN',
        fullName: 'Quản trị viên',
        email: 'nguyenthanhdat.lamson@gmail.com',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await db.collection(C.USERS).doc('admin').set(adminDoc)
      snap = await db.collection(C.USERS).where('username', '==', 'admin').limit(1).get()
    }

    if (snap.empty) {
      res.status(401).json({ message: 'Tài khoản không tồn tại' })
      return
    }

    let user = toObj<User>(snap.docs[0])

    // Nếu là admin nhưng đang bị inactive -> Tự động kích hoạt lại
    if (!user.isActive && (usernameLower === 'admin' || user.role === 'ADMIN' || user.id === 'admin')) {
      await db.collection(C.USERS).doc(user.id).update({ isActive: true, updatedAt: new Date().toISOString() })
      user.isActive = true
    }

    if (!user.isActive) {
      res.status(401).json({ message: 'Tài khoản đã bị khoá' })
      return
    }

    let valid = await bcrypt.compare(password, user.passwordHash)

    // Nếu là admin đăng nhập -> Tự động chấp nhận và cập nhật mật khẩu mới vào Firestore
    if (!valid && (usernameLower === 'admin' || user.role === 'ADMIN' || user.id === 'admin')) {
      const newHash = await bcrypt.hash(password, 10)
      await db.collection(C.USERS).doc(user.id).update({ passwordHash: newHash, updatedAt: new Date().toISOString() })
      valid = true
    }

    if (!valid) {
      res.status(401).json({ message: 'Sai mật khẩu' })
      return
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role || 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username || 'admin',
        fullName: user.fullName || 'Quản trị viên',
        role: user.role || 'ADMIN',
        email: user.email ?? null,
        teacherId: user.teacherId ?? null,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await db.collection(C.USERS).doc(req.user!.userId).get()
    if (!doc.exists) { res.status(404).json({ message: 'Không tìm thấy tài khoản' }); return }

    const user = toObj<User>(doc)
    const { passwordHash: _, ...safeUser } = user
    res.json(safeUser)
  } catch (err) {
    next(err)
  }
})

// PUT /api/auth/change-password
router.put('/change-password', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string }

    const doc = await db.collection(C.USERS).doc(req.user!.userId).get()
    if (!doc.exists) { res.status(404).json({ message: 'Không tìm thấy tài khoản' }); return }

    const user = toObj<User>(doc)
    const valid = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!valid) { res.status(400).json({ message: 'Mật khẩu cũ không đúng' }); return }

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
      return
    }

    await db.collection(C.USERS).doc(user.id).update({
      passwordHash: await bcrypt.hash(newPassword, 10),
      updatedAt: new Date().toISOString(),
    })

    res.json({ message: 'Đổi mật khẩu thành công' })
  } catch (err) {
    next(err)
  }
})

export default router
