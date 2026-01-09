import { ReleaseStatus } from './types';

export const STATUS_COLORS: Record<ReleaseStatus, string> = {
  [ReleaseStatus.DRAFT]: 'bg-gray-500 text-gray-100',
  [ReleaseStatus.PENDING]: 'bg-yellow-500 text-yellow-900',
  [ReleaseStatus.NEEDS_INFO]: 'bg-blue-500 text-blue-900',
  [ReleaseStatus.REJECTED]: 'bg-red-500 text-red-900',
  [ReleaseStatus.APPROVED]: 'bg-green-500 text-green-900',
  [ReleaseStatus.PROCESSED]: 'bg-teal-500 text-teal-900',
  [ReleaseStatus.PUBLISHED]: 'bg-purple-500 text-purple-900',
  [ReleaseStatus.TAKEDOWN]: 'bg-orange-500 text-orange-900',
  [ReleaseStatus.CANCELLED]: 'bg-gray-600 text-gray-200',
};