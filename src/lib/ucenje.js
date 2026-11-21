import { base44 } from '@/api/base44Client';

export const KATEGORIJE = ['Za predavanje', 'Domaća zadaća', 'Dodatni listići i zadaci'];

export const STATUSI = ['Za riješiti', 'Potreban ispravak', 'Završeno'];

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export async function signedUrl(file_uri) {
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 600 });
  return signed_url;
}

export async function uploadPrivate(file) {
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  return { file_uri, file_name: file.name };
}

export function sortByOrder(items) {
  return [...items].sort((a, b) => (a.redoslijed ?? 0) - (b.redoslijed ?? 0));
}