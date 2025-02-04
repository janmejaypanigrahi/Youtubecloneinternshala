import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { createError } from '../error.js';
import jwt from 'jsonwebtoken';

import Token from '../models/Emailtoken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';  // Correct usage of the crypto module

export const signup = async (req, res, next) => {
    try {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);
        let newUser = new User({ ...req.body, password: hash });
        newUser = await newUser.save();

        const token = new Token({
            userId: newUser._id,
            token: crypto.randomBytes(32).toString('hex'),
        });
        await token.save();

        const url = `${process.env.BASE_URL}auth/${newUser._id}/verify/${token.token}`;
        await sendEmail(newUser.email, 'Verify Email', url);
        
        res.status(201).send({ message: 'User created successfully. An email has been sent to your account for verification.' });
    } catch (err) {
        console.log(err);
        if (err.message.includes('username')) {
            if (err.message.includes('shorter')) {
                return next(createError(404, 'Username should be at least 3 characters long.'));
            }
            return next(createError(404, 'Username already exists.'));
        }
        return next(createError(404, 'Email is taken.'));
    }
};

export const signin = async (req, res, next) => {
    console.log('signing in');
    try {
        const user = await User.findOne(
            req.body.username ? { username: req.body.username } : { email: req.body.email }
        );

        if (!user) return next(createError(404, 'User not found'));
        
        const isCorrect = await bcrypt.compare(req.body.password, user.password);
        console.log('isCorrect: ' + isCorrect);
        if (!isCorrect) return next(createError(400, 'Wrong Credentials'));

        if (!user.verified) {
            let token = await Token.findOne({ userId: user._id });
            console.log('token!: ' + !token);
            if (token) {
                token = new Token({
                    userId: user._id,
                    token: crypto.randomBytes(32).toString('hex'),
                });
                await token.save();
                const url = `${process.env.BASE_URL}auth/${user._id}/verify/${token.token}`;
                console.log('url: ' + url);
                await sendEmail(user.email, 'Verify Email', url);
            }

            return res.status(400).send({ message: 'An email has been sent to your account for verification.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        const { password, ...userData } = user._doc;

        res.cookie('access_token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,  // 1 week
        }).status(200).json(userData);
    } catch (err) {
        next(err);
    }
};

export const signout = async (req, res, next) => {
    try {
        res.clearCookie('access_token', { path: '/' });
        res.status(200).send('User logged out');
    } catch (err) {
        next(err);
    }
};

export const googleAuth = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            return res
                .cookie('access_token', token, { httpOnly: true })
                .status(200)
                .json(user._doc);
        }

        const newUser = new User({ ...req.body, fromGoogle: true });
        const savedUser = await newUser.save();
        const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET);

        res
            .cookie('access_token', token, { httpOnly: true })
            .status(200)
            .json(savedUser._doc);
    } catch (err) {
        next(err);
    }
};

export const verifytoken = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        if (!user) return res.status(400).send({ message: 'User not found' });

        const token = await Token.findOne({ userId: user._id, token: req.params.token });
        if (!token) return res.status(400).send({ message: 'Invalid link' });

        await User.findByIdAndUpdate(user._id, { verified: true }, { new: true });
        await token.remove();

        res.status(200).send({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error' });
    }
};
