const colors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  more_info: 'bg-amber-100 text-amber-800',
  verified: 'bg-green-100 text-green-800',
  unverified: 'bg-gray-100 text-gray-800',
  failed: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  processing: 'bg-purple-100 text-purple-800',
};

const Badge = ({ status }: { status: string }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
    {status?.replace(/_/g, ' ').toUpperCase()}
  </span>
);

export default Badge;