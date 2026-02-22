export interface Download {
  title: string;
  uris: string[];
  uploadDate: string;
  fileSize: string;
  repackLinkSource: string;
}

export interface ForumSection {
  id: number;
  name: string;
}

export interface SectionOutput {
  name: string;
  downloads: Download[];
}
