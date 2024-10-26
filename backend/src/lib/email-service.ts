import nodemailer from 'nodemailer';
import { type User } from '@/types/user';

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send verification email
export const sendVerificationEmail = async (
  user: User,
  token: string,
  redirect?: string
) => {
  const url =
    (redirect ??
      `${process.env.FRONTEND_URL ?? process.env.APP_BASE_URL}/verify-email`) +
    `?token=${token}`;
  await transporter.sendMail({
    from: '"OD automation" <no-reply@yourapp.com>',
    to: user.email,
    subject: 'Verify Your Email',
    html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
  });
};

// Function to send reset password email
export const sendResetPasswordEmail = async (
  user: User,
  token: string,
  redirect?: string
) => {
  const url =
    (redirect ??
      `${
        process.env.FRONTEND_URL ?? process.env.APP_BASE_URL
      }/reset-password`) + `?token=${token}`;
  await transporter.sendMail({
    from: '"OD automation" <no-reply@yourapp.com>',
    to: user.email,
    subject: 'Reset Your Password',
    html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
  });
};