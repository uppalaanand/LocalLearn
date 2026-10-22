import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { countLabel, ratingLabel } from '../utils/format';
import { teacherService } from '../services/dataServices';
export default function Teachers() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { teacherService.getTeachers().then(res => setTeachers(res.data)).catch(err => setError(err.message)).finally(() => setLoading(false)); }, []);
  return <section><h1 className="text-3xl font-bold mb-6">Browse Teachers</h1>{error && <p role="alert">{error}</p>}{loading ? <p>Loading teachers…</p> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{teachers.map(t => <Link to={`/teacher/${t.id}`} key={t.id} className="bg-white rounded-xl border p-6"><h2 className="text-xl font-bold">{t.name}</h2><p>{t.skills.join(', ')}</p><p>{ratingLabel(t.rating, t.reviewsCount)} · {countLabel(t.reviewsCount, 'review')}</p></Link>)}</div>}{!loading && !error && !teachers.length && <p>No eligible teachers to display yet.</p>}</section>;
}
