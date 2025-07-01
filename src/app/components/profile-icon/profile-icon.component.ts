import { Component, Input } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-icon',
  imports: [CommonModule],
  templateUrl: './profile-icon.component.html',
  styleUrl: './profile-icon.component.css'
})
export class ProfileIconComponent {
  photoURL: string | null = null;
  displayName: string | null = null;
  @Input()
  fullFormat = false;

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.photoURL = user?.photoURL || null;
      this.displayName = user?.displayName || null;
    });
  }
}
