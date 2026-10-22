import mongoose from 'mongoose';
import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { weekday, validateSession } from '../utils/schedule.js';
import { createClassSchema, updateClassSchema } from '../validations/classValidation.js';
import { classAccess } from '../middleware/classAccess.js';
import { deleteClass } from '../controllers/classController.js';
import { deleteMessage, inviteStudent, sendReminders, markAttendance, addScheduleSession, updateScheduleSession } from '../controllers/classManagementController.js';
import Class from '../models/Class.js';
import Enrollment from '../models/Enrollment.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Schedule from '../models/Schedule.js';

const call = (handler, req) => new Promise(resolve => {
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { resolve({ status: this.statusCode, body }); } };
  handler({ body: {}, params: { id: 'class1' }, user: { _id: 'teacher1', role: 'teacher', name: 'Teacher' }, ...req }, res, error => resolve({ error }));
});
afterEach(() => mock.restoreAll());

for (const [date, day] of [['2026-05-23', 'Saturday'], ['2026-05-26', 'Tuesday'], ['2026-10-21', 'Wednesday']]) {
  test(`weekday derives ${date} as ${day}`, () => assert.equal(weekday(date), day));
}
for (const date of ['', 'not-a-date', '2026-02-30', '2026-13-01', '2026-5-23']) {
  test(`invalid session date rejected: ${date}`, () => assert.equal(weekday(date), ''));
}
test('session rejects reversed and invalid times', () => {
  assert.ok(validateSession({ date: '2026-05-23', startTime: '19:00', endTime: '18:00' }));
  assert.ok(validateSession({ date: '2026-05-23', startTime: '29:00', endTime: '30:00' }));
  assert.equal(validateSession({ date: '2026-05-23', startTime: '18:00', endTime: '19:00' }), null);
});
for (const price of [-500, '-500', 'abc', '', Infinity]) {
  test(`create/update reject invalid price ${price}`, () => {
    assert.ok(createClassSchema.body.validate({ title: 'Valid class', description: 'Valid description here', category: 'sports', price }).error);
    assert.ok(updateClassSchema.body.validate({ price }).error);
  });
}
test('zero-price classes are valid on create and update', () => {
  assert.equal(createClassSchema.body.validate({ title: 'Free class', description: 'Free class description', category: 'sports', price: 0 }).error, undefined);
  assert.equal(updateClassSchema.body.validate({ price: 0 }).error, undefined);
});
test('non-owning teacher cannot manage class', async () => {
  mock.method(Class, 'findById', async () => ({ _id: 'class1', teacher: 'other' }));
  const result = await call(classAccess, { method: 'POST', path: '/class1/schedule' });
  assert.equal(result.error.statusCode, 403);
});
test('non-member cannot read class management', async () => {
  mock.method(Class, 'findById', async () => ({ _id: 'class1', teacher: 'other' }));
  mock.method(Enrollment, 'exists', async () => null);
  assert.equal((await call(classAccess, { method: 'GET', path: '/class1' })).error.statusCode, 403);
});
test('owner can manage class', async () => {
  mock.method(Class, 'findById', async () => ({ _id: 'class1', teacher: 'teacher1' }));
  assert.equal((await call(classAccess, { method: 'POST', path: '/class1/schedule' })).error, undefined);
});
test('student cannot delete a class', async () => {
  mock.method(Class, 'findById', async () => ({ teacher: 'teacher1' }));
  assert.equal((await call(deleteClass, { user: { _id: 'student1', role: 'student' } })).error.statusCode, 403);
});
test('class deletion returns not-found for missing class', async () => {
  mock.method(Class, 'findById', async () => null);
  assert.equal((await call(deleteClass, {})).error.statusCode, 404);
});
for (const userId of ['author', 'teacher1', 'outsider']) {
  test(`message deletion permission for ${userId}`, async () => {
    let deleted = false;
    mock.method(Message, 'findOne', async query => {
      assert.equal(query.class, 'class1');
      return { sender: 'author', deleteOne: async () => { deleted = true; } };
    });
    const result = await call(deleteMessage, { params: { id: 'class1', messageId: 'msg1' }, user: { _id: userId }, classRecord: { teacher: 'teacher1' } });
    assert.equal(deleted, userId !== 'outsider');
    if (userId === 'outsider') assert.equal(result.error.statusCode, 403);
    else assert.equal(result.status, 200);
  });
}
for (const body of [{}, { name: 'Student', email: '' }, { name: '', email: 'test@example.com' }, { name: 'Student', email: 'invalid' }]) {
  test(`invalid invitation ${JSON.stringify(body)}`, async () => assert.equal((await call(inviteStudent, { body })).error.statusCode, 400));
}
test('invite does not claim email delivery to a nonexistent account', async () => {
  mock.method(User, 'findOne', async () => null);
  const result = await call(inviteStudent, { body: { name: 'Student', email: 'test@example.com' } });
  assert.equal(result.error.statusCode, 400);
});
test('valid invitation creates student notification', async () => {
  mock.method(User, 'findOne', async () => ({ _id: 'student1' }));
  mock.method(Enrollment, 'exists', async () => null);
  const create = mock.method(Notification, 'create', async body => { assert.equal(body.user, 'student1'); return body; });
  const result = await call(inviteStudent, { body: { name: 'Student', email: 'test@example.com' }, classRecord: { title: 'Class' } });
  assert.equal(result.status, 201); assert.equal(create.mock.callCount(), 1);
});
test('empty attendance gives explicit client error', async () => {
  assert.equal((await call(markAttendance, { body: { records: [] } })).error.statusCode, 400);
});
test('attendance rejects non-members', async () => {
  mock.method(Enrollment, 'find', () => ({ distinct: async () => ['student1'] }));
  assert.equal((await call(markAttendance, { body: { records: [{ studentId: 'outsider', status: 'present' }] } })).error.statusCode, 400);
});
for (const count of [0, 2]) {
  test(`payment reminders report ${count} recipients`, async () => {
    mock.method(Enrollment, 'find', async () => Array.from({ length: count }, (_, i) => ({ student: `student${i}` })));
    mock.method(Notification, 'insertMany', async rows => assert.equal(rows.length, count));
    const result = await call(sendReminders, { classRecord: { _id: 'class1', title: 'Class', price: 100 } });
    assert.equal(result.body.data.count, count);
  });
}
test('free class does not generate payment reminders', async () => {
  mock.method(Notification, 'insertMany', async rows => assert.deepEqual(rows, []));
  const result = await call(sendReminders, { classRecord: { _id: 'class1', title: 'Class', price: 0 } });
  assert.equal(result.body.data.count, 0);
});
test('session create ignores inconsistent supplied weekday and defaults optional topic', async () => {
  mock.method(Schedule, 'create', async body => { assert.equal(body.day, 'Saturday'); assert.equal(body.topic, 'Class Session'); return { ...body, _id: 'session1' }; });
  const result = await call(addScheduleSession, { classRecord: { _id: 'class1' }, body: { date: '2026-05-23', day: 'Monday', startTime: '18:00', endTime: '19:00' } });
  assert.equal(result.body.data.id, 'session1');
});
test('session update is scoped to class and rejects cross-class identifiers', async () => {
  mock.method(Schedule, 'findOneAndUpdate', async query => { assert.deepEqual(query, { _id: 'other-session', class: 'class1' }); return null; });
  const result = await call(updateScheduleSession, { params: { id: 'class1', sessionId: 'other-session' }, body: { date: '2026-05-23', startTime: '18:00', endTime: '19:00' } });
  assert.equal(result.error.statusCode, 404);
});

test('owner class deletion runs the complete cascade in a transaction', async () => {
  const names = ['Schedule', 'Announcement', 'Enrollment', 'Message', 'JoinRequest', 'TrialBooking', 'Attendance', 'Assignment', 'Review'];
  const deleted = [];
  let committed = false, ended = false;
  const session = { withTransaction: async action => { await action(); committed = true; }, endSession: async () => { ended = true; } };
  mock.method(mongoose, 'startSession', async () => session);
  mock.method(Class, 'findById', async () => ({ _id: 'class1', teacher: 'teacher1' }));
  for (const name of names) {
    const Model = (await import(`../models/${name}.js`)).default;
    mock.method(Model, 'deleteMany', async (query, options) => { assert.equal(query.class, 'class1'); assert.equal(options.session, session); deleted.push(name); });
  }
  mock.method(Notification, 'deleteMany', async query => assert.deepEqual(query, { classId: 'class1' }));
  mock.method(User, 'updateMany', async (query, update) => assert.deepEqual(update, { $pull: { favorites: 'class1' } }));
  mock.method(Class, 'deleteOne', async query => assert.deepEqual(query, { _id: 'class1' }));
  const result = await call(deleteClass, {});
  assert.equal(result.status, 200); assert.deepEqual(deleted, names); assert.ok(committed); assert.ok(ended);
});
