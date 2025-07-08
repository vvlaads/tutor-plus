import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-icon',
  imports: [CommonModule],
  templateUrl: './profile-icon.component.html',
  styleUrl: './profile-icon.component.css'
})
export class ProfileIconComponent implements OnInit {
  public photoURL: string | null = null;
  public displayName: string | null = null;

  @Input()
  public fullFormat = false;

  public constructor(private authService: AuthService) { }

  public ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.photoURL = user?.photoURL || null;
      this.displayName = user?.displayName || null;
    });
  }
}
