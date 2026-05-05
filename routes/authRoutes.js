import express from 'express';
import User from '../models/User.js'
import mongoose from 'mongoose';
import { generateToken } from '../utils/generateToken.js';
import { jwtVerify } from 'jose';
import { JWT_SECRET } from '../utils/getJwtSecret.js';

const router = express.Router();

// @route POST    /api/auth/register
// @description   register a new user
// @access        Public

// already bound to /user/api/auth ... only need to add /register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('All fields are required');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400);
      throw new Error('User already exists');
    }

    // User model has create, find, delete, etc
    const user = await User.create({ name, email, password });

    // Create tokens
    const payload = { userId: user._id.toString() };
    const accessToken = await generateToken(payload, '1m');
    const refreshToken = await generateToken(payload, '30d');    

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',  // yes if in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      //sameSite: 'none', //We can setup a proxy in Vercel to make the frontend and backend on the same domain. This way, we can set the `sameSite` option to `lax`. That may be something we do later.
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);
    next(err);
  }

});

// @route POST    /api/auth/login
// @description   register a new user
// @access        Public
router.post('/login', async(req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // Create tokens
    const payload = { userId: user._id.toString() };
    const accessToken = await generateToken(payload, '1m');
    const refreshToken = await generateToken(payload, '30d');

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      //sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.log(err)
    next(err)
  }
})

// @route POST    /api/auth/logout
// @description   logout and clear refresh token
// @access        Private

// already bound to /user/api/auth ... only need to add /register
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.status(200).json({ message: 'Logged out successfully' });
});

/*
res.cookie('refreshToken', '', {
  expires: new Date(0),
  ...options
});
It replaces it with a new cookie that expires now.
*/

// @route   POST /api/auth/refresh
// @desc    Issue a new access token using refresh token
// @access  Public (but requires valid refresh token in cookie)
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    console.log('Refreshing token...');

    if (!token) {
      res.status(401);
      throw new Error('Refresh token missing');
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    const user = await User.findById(payload.userId);

    if (!user) {
      res.status(401);
      throw new Error('User no longer exists');
    }

    const newAccessToken = await generateToken(
      { userId: user._id.toString() },
      '1m'
    );

    res.json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);
    err.message = 'Invalid or expired refresh token';
    res.status(401);
    next(err);
  }
});

// In Postman, click on the `Cookies` tab and you should see the refresh token in the cookies. It is HTTP-only, so you won't be able to see it in the console or access it in JavaScript.

export default router;
