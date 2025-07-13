import { Routes } from '@angular/router';
import { StudentsComponent } from './pages/students/students.component';
import { LoginComponent } from './pages/login/login.component';
import { ScheduleComponent } from './pages/schedule/schedule.component';
import { authGuard } from './guards/auth.guard';
import { StudentProfileComponent } from './pages/student-profile/student-profile.component';
import { HomeComponent } from './pages/home/home.component';
import { WaitListComponent } from './pages/wait-list/wait-list.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', component: HomeComponent, canActivate: [authGuard] },
    { path: 'students', component: StudentsComponent, canActivate: [authGuard] },
    { path: 'schedule', component: ScheduleComponent, canActivate: [authGuard] },
    { path: 'wait-list', component: WaitListComponent, canActivate: [authGuard] },
    { path: 'student/:id', component: StudentProfileComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: 'login' }
];
