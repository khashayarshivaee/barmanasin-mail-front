import {
  Component,
  inject,
  input,
  output,
} from '@angular/core';

import { IonIcon } from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  archiveOutline,
  createOutline,
  fileTrayFullOutline,
  mailOutline,
  paperPlaneOutline,
  personCircleOutline,
  starOutline,
  trashOutline,
} from 'ionicons/icons';

import {
  MailFolder,
  MailFolderStateService,
} from '../services/mail-folder-state.service';

import {
  MailFolderBadgeService,
} from '../services/mail-folder-badge.service';

@Component({
  selector: 'app-mail-sidebar',
  standalone: true,
  templateUrl: './mail-sidebar.component.html',
  styleUrls: ['./mail-sidebar.component.scss'],
  imports: [
    IonIcon,
  ],
})
export class MailSidebarComponent {
  private readonly folderState =
    inject(MailFolderStateService);

  private readonly badgeService =
    inject(MailFolderBadgeService);


  readonly badges =
    this.badgeService.badges;

  readonly activeFolder =
    this.folderState.activeFolder;




  readonly folders = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: 'mail-outline',
    },

    {
      id: 'starred',
      label: 'Starred',
      icon: 'star-outline',
    },

    {
      id: 'sent',
      label: 'Sent',
      icon: 'paper-plane-outline',
    },

    {
      id: 'drafts',
      label: 'Drafts',
      icon: 'file-tray-full-outline',
    },

    {
      id: 'archive',
      label: 'Archive',
      icon: 'archive-outline',
    },

    {
      id: 'trash',
      label: 'Trash',
      icon: 'trash-outline',
    },

  ] as const;



  readonly folderChange =
    output<MailFolder>();

  readonly compose =
    output<void>();

  readonly closeRequested =
    output<void>();

  readonly teamProfileActive =
    input(false);

  readonly teamProfileRequested =
    output<void>();

  constructor() {
    this.badgeService.load();
    addIcons({
      archiveOutline,
      createOutline,
      fileTrayFullOutline,
      mailOutline,
      paperPlaneOutline,
      personCircleOutline,
      starOutline,
      trashOutline,
    });
  }

  selectFolder(
    folder: MailFolder,
  ): void {

    this.folderState.setFolder(
      folder,
    );

    this.folderChange.emit(
      folder,
    );

    this.closeRequested.emit();

  }

  openCompose(): void {

    this.compose.emit();

    this.closeRequested.emit();

  }

  badge(
    folder: string,
  ) {

    return this.badges()[folder]
      ??
      {
        total: 0,
        unread: 0,
      };

  }

  openTeamProfile(): void {

    this.teamProfileRequested.emit();

    this.closeRequested.emit();

  }
}
