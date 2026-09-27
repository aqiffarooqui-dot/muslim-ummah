export type AnnouncementType =
  | 'INFO'
  | 'UPDATE'
  | 'PREMIUM'
  | 'IMPORTANT';

export type Announcement = {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  createdAt: string;
  published: boolean;
};
