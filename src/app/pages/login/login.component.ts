import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  public constructor(private authService: AuthService) {

  }
  public loginWithGoogle(): void {
    this.authService.googleSignIn();
  }
}
