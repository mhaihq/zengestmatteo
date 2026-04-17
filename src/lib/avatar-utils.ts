const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-cyan-500',
];

export function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
