import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-notification',
  imports: [],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent {
  message = signal('');
  isVisible = signal(false);

  show(message: string, duration: number = 2000) {
    this.message.set(message);
    this.isVisible.set(true);

    setTimeout(() => {
      this.isVisible.set(false);
    }, duration);
  }
}
