import { Injectable, signal } from '@angular/core';

export type MailFolder =
  | 'inbox'
  | 'starred'
  | 'sent'
  | 'drafts'
  | 'archive'
  | 'trash';

@Injectable({
  providedIn: 'root',
})
export class MailFolderStateService {
  readonly activeFolder = signal<MailFolder>('inbox');

  setFolder(
    folder: MailFolder,
  ): void {
    this.activeFolder.set(folder);
  }
}
