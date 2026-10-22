import Class from '../models/Class.js';
import Enrollment from '../models/Enrollment.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
export const classAccess = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) return next(ApiError.notFound('Class not found'));
  req.classRecord = cls;
  const owner = String(cls.teacher) === String(req.user._id);
  if (req.method !== 'GET' && !req.path.includes('/chat') && !owner) return next(ApiError.forbidden('Only the owning teacher can manage this class'));
  if (!owner && !await Enrollment.exists({ class: cls._id, student: req.user._id, status: 'active' })) return next(ApiError.forbidden('You must be a member of this class'));
  next();
});
