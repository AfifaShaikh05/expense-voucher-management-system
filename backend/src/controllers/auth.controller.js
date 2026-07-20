const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateToken } = require('../utils/jwt');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, employeeId } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Missing required fields: name, email, password, and role are required.'
      });
    }

    // 2. Validate role is one of the allowed values
    const validRoles = ['EMPLOYEE', 'DIRECTOR', 'ACCOUNTS'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles are: ${validRoles.join(', ')}`
      });
    }

    // 3. Check if email already exists in DB
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'User with this email already exists.'
      });
    }

    // 4. Hash the password (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create the user in the database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        employeeId
      }
    });

    // 6. Return 201 with the created user info (excluding password)
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      message: 'An unexpected error occurred during registration.'
    });
  }
};

/**
 * Login an existing user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate both fields are present
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // If user not found, return generic invalid credentials error (security best practice)
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // 4. Generate JWT token
    const token = generateToken({
      userId: user.id,
      role: user.role
    });

    // 5. Return 200 with token and user info (excluding password)
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      message: 'An unexpected error occurred during login.'
    });
  }
};

module.exports = {
  register,
  login
};
