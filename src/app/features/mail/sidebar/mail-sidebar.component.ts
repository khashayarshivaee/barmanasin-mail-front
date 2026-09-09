import {
  Component,
  inject,
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
  starOutline,
  trashOutline,
} from 'ionicons/icons';

import {
  MailFolder,
  MailFolderStateService,
} from '../services/mail-folder-state.service';

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

  readonly activeFolder =
    this.folderState.activeFolder;

  readonly folderChange =
    output<MailFolder>();

  readonly compose =
    output<void>();

  constructor() {
    addIcons({
      archiveOutline,
      createOutline,
      fileTrayFullOutline,
      mailOutline,
      paperPlaneOutline,
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
  }

  openCompose(): void {
    this.compose.emit();
  }
}
