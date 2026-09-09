import {
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  chevronDownOutline,
  searchOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-mail-topbar',
  standalone: true,
  templateUrl: './mail-topbar.component.html',
  styleUrls: ['./mail-topbar.component.scss'],
  imports: [
    FormsModule,
    IonIcon,
  ],
})
export class MailTopbarComponent {
  readonly userName = input<string>('');
  readonly mailboxAddress = input<string>('');

  readonly searchChange = output<string>();
  readonly accountClick = output<void>();

  readonly searchQuery = signal('');

  constructor() {
    addIcons({
      chevronDownOutline,
      searchOutline,
    });
  }

  updateSearch(value: string): void {
    this.searchQuery.set(value);
    this.searchChange.emit(value);
  }

  openAccount(): void {
    this.accountClick.emit();
  }

  initials(): string {
    const source =
      this.userName().trim() ||
      this.mailboxAddress().trim();

    if (!source) {
      return 'BM';
    }

    const parts = source
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return (
        parts[0][0] +
        parts[1][0]
      ).toUpperCase();
    }

    return source
      .slice(0, 2)
      .toUpperCase();
  }
}
