import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import Teacher from '../models/teacher.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
        expiresIn: '30d',
    });
};

export const register = async (req, res) => {
    try {
        const {
            username,
            password,
            name,
            email,
            phone,
            teacherRole = 'parttime', // "fulltime" or "parttime"
            dateOfBirth,
            role = 'user' // System role: 'user', 'st', 'admin'
        } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }

        // Check if email exists (for Teacher)
        if (email) {
            const emailExists = await Teacher.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email đã được sử dụng bởi giáo viên khác' });
            }
        }

        // Create associated Teacher record
        const teacher = await Teacher.create({
            name,
            email,
            phone,
            dateOfBirth,
            role: teacherRole,
            status: 'active'
        });

        // Create User record linked to Teacher
        const user = await User.create({
            username,
            password,
            name,
            role,
            teacherId: teacher._id
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
                teacherId: teacher._id,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Không thể tạo tài khoản' });
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Return token and user info
        res.json({
            _id: user._id,
            username: user.username,
            name: user.name,
            role: user.role,
            teacherId: user.teacherId,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('teacherId'); // Populate full teacher details
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
