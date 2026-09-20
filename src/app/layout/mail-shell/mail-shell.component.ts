import {
  Component,
  ContentChild,
  signal,
} from '@angular/core';

import {
  MailTopbarComponent,
} from '../../features/mail/topbar/mail-topbar.component';

import {
  MailSidebarComponent,
} from '../../features/mail/sidebar/mail-sidebar.component';

import {
  AfterContentInit,
} from '@angular/core';

@Component({
  selector: 'app-mail-shell',
  standalone: true,
  templateUrl: './mail-shell.component.html',
  styleUrls: ['./mail-shell.component.scss'],
})
export class MailShellComponent implements AfterContentInit {

  /**
   * Mobile sidebar state
   * Desktop behavior remains unchanged.
   */
  readonly isMobileSidebarOpen =
    signal(false);

  @ContentChild(
    MailTopbarComponent,
  )
  private topbar?: MailTopbarComponent;

  @ContentChild(
    MailSidebarComponent,
  )
  private sidebar?: MailSidebarComponent;


  openMobileSidebar(): void {
    this.isMobileSidebarOpen.set(true);
  }


  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }


  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update(
      value => !value,
    );
  }

  ngAfterContentInit(): void {

    this.topbar?.menuClick.subscribe(() => {

      this.openMobileSidebar();

    });


    this.sidebar?.closeRequested.subscribe(() => {

      this.closeMobileSidebar();

    });

  }

}
