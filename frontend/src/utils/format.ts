export function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
export function ratingLabel(rating: number, reviewCount?: number) {
  return Number.isFinite(rating) && rating > 0 && reviewCount !== 0 ? String(rating) : 'New';
}
