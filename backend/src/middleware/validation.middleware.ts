import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult, ValidationChain } from 'express-validator';
import { validatePasswordStrength } from '../services/auth.service';

// ============================================================
// Validation result handler — must be last in validator chain
// ============================================================

export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      error:   'VALIDATION_ERROR',
      message: 'Data yang dikirim tidak valid.',
      errors:  errors.array().map((e) => ({
        field:   e.type === 'field' ? e.path : e.type,
        message: e.msg,
      })),
    });
    return;
  }
  next();
}

// ============================================================
// Registration validator
// ============================================================

export const validateRegister: ValidationChain[] = [
  body('email')
    .isEmail().withMessage('Format email tidak valid.')
    .normalizeEmail()
    .isLength({ max: 255 }),

  body('password')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter.')
    .custom((value: string) => {
      const { valid, errors } = validatePasswordStrength(value);
      if (!valid) throw new Error(errors.join(', '));
      return true;
    }),

  body('full_name')
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('Nama lengkap 2-150 karakter.'),

  body('company_name')
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Nama perusahaan wajib diisi.'),

  body('business_type')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Tipe bisnis wajib diisi.'),

  body('contact_person')
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('Nama kontak wajib diisi.'),

  body('position')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Jabatan wajib diisi.'),

  body('mobile_number')
    .trim()
    .matches(/^[\+]?[0-9\s\-\(\)]{8,20}$/).withMessage('Nomor mobile tidak valid.'),

  body('whatsapp_number')
    .trim()
    .matches(/^[\+]?[0-9\s\-\(\)]{8,20}$/).withMessage('Nomor WhatsApp tidak valid.'),

  body('project_location')
    .trim()
    .isLength({ min: 2, max: 255 }).withMessage('Lokasi proyek wajib diisi.'),

  body('industry')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Industri wajib diisi.'),

  body('website')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Format website tidak valid.'),
];

// ============================================================
// Login validator
// ============================================================

export const validateLogin: ValidationChain[] = [
  body('email')
    .isEmail().withMessage('Format email tidak valid.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password wajib diisi.'),
];

// ============================================================
// User approval validator
// ============================================================

export const validateApproval: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('ID user tidak valid.'),
];

export const validateRejection: ValidationChain[] = [
  param('id')
    .isUUID().withMessage('ID user tidak valid.'),

  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Alasan penolakan wajib diisi (min 10 karakter).'),
];

// ============================================================
// Part search validator
// ============================================================

export const validatePartSearch: ValidationChain[] = [
  query('q')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Kata kunci pencarian minimal 2 karakter.')
    .matches(/^[a-zA-Z0-9\-\_\.\s\/]+$/).withMessage('Karakter pencarian tidak valid.'),
];

export default {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateApproval,
  validateRejection,
  validatePartSearch,
};
