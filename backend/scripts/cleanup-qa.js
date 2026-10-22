// Dry-run by default. Run from backend: node scripts/cleanup-qa.js [--apply]
// Only the explicitly named QA artifacts are eligible; ambiguity aborts before deletion.
import mongoose from 'mongoose';
import config from '../config/index.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import DirectMessage from '../models/DirectMessage.js';
import Notification from '../models/Notification.js';
import { deleteClass } from '../controllers/classController.js';

const apply = process.argv.includes('--apply');
try {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
  const teacher = await User.findOne({ email: 'teacher1@locallearn.com', role: 'teacher' });
  const student = await User.findOne({ email: 'student1@locallearn.com', role: 'student' });
  if (!teacher || !student) throw new Error('Expected QA accounts not found; nothing deleted');
  const edited = await Class.findOne({ _id: '6ad8e834253e0c7d59406609', teacher: teacher._id, title: 'QA TEST - edited' });
  const priceChecks = await Class.find({ teacher: teacher._id, title: 'QA TEST - price check', price: 500 });
  const messages = await DirectMessage.find({ sender: teacher._id, receiver: student._id, text: 'QA TEST - DM reply, please delete.' });
  const invitee = await User.findOne({ email: 'qatest-invitee@example.com' });
  const invitations = invitee ? await Notification.find({ user: invitee._id, title: 'Class invitation', message: { $regex: '^' + teacher.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' invited you to ' } }) : [];
  if (priceChecks.length > 1 || messages.length > 1 || invitations.length > 1) throw new Error('Ambiguous duplicate QA artifacts; inspect manually before deleting');
  const classes = [...(edited ? [edited] : []), ...priceChecks];
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', classes: classes.map(c => ({ id: c.id, title: c.title })), directMessages: messages.length, invitations: invitations.length, note: 'Class deletion also removes its group messages and pending join requests; no account is deleted.' }, null, 2));
  if (apply) {
    for (const cls of classes) {
      await new Promise((resolve, reject) => {
        const response = { status() { return this; }, json() { resolve(); } };
        deleteClass({ params: { id: cls.id }, user: teacher }, response, reject);
      });
    }
    if (messages.length) await DirectMessage.deleteOne({ _id: messages[0]._id, sender: teacher._id });
    if (invitations.length) await Notification.deleteOne({ _id: invitations[0]._id, user: invitee._id });
    console.log('Matched QA artifacts deleted. Unmatched items were not touched.');
  }
} catch (error) {
  // Do not print connection strings or credentials.
  console.error('QA cleanup failed:', error.name, error.code || '');
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
