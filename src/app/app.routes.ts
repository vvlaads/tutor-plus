import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { StudentsComponent } from './components/students/students.component';
import { LoginComponent } from './components/login/login.component';
import { ScheduleComponent } from './components/schedule/schedule.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent, canActivate: [authGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'students', component: StudentsComponent, canActivate: [authGuard] },
    { path: 'schedule', component: ScheduleComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: 'login' }
];
