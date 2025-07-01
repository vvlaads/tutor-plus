import { Component, inject } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomSelectComponent } from '../custom-select/custom-select.component';

@Component({
  selector: 'app-add-student-dialog',
  standalone: true,
  imports: [FormsModule, CommonModule, CustomSelectComponent],
  templateUrl: './add-student-dialog.component.html',
  styleUrls: ['./add-student-dialog.component.css']
})
export class AddStudentDialogComponent {
  private firestore = inject(Firestore);
  public dialogRef = inject(MatDialogRef<AddStudentDialogComponent>);

  studentName: string = '';
  studentPhone: string = '';
  studentSubject: string = '';
  studentCommunication: string = '';
  studentPlatform: string = '';
  studentCost: number = 0;

  communicationOptions = [
    { value: 'Telegram', text: 'Telegram', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Telegram%20Icon.png' },
    { value: 'WhatsApp', text: 'WhatsApp', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Whatsapp%20Icon.png' },
    { value: 'Телефон', text: 'Телефон', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Phone%20Icon.png' }
  ];

  platformOptions = [
    { value: 'Zoom', text: 'Zoom', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Zoom%20Icon.png' },
    { value: 'Microsoft Teams', text: 'Microsoft Teams', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/MicrosoftTeams%20Icon.png' },
    { value: 'Telegram', text: 'Telegram', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Telegram%20Icon.png' }
  ];
  onSelect(option: any, type: 'communication' | 'platform') {
    console.log('Выбрано:', option);
    if (type === 'communication') {
      this.studentCommunication = option.value;
    } else if (type === 'platform') {
      this.studentPlatform = option.value;
    }
  }

  async addStudent() {
    try {
      const studentsRef = collection(this.firestore, 'students');

      await addDoc(studentsRef, {
        name: this.studentName,
        phone: this.studentPhone,
        subject: this.studentSubject,
        communication: this.studentCommunication,
        platform: this.studentPlatform,
        cost: this.studentCost,
        isActual: true,
      });

      console.log(`Добавлен студент:
        Имя: ${this.studentName}
        Телефон: ${this.studentPhone}
        Предмет: ${this.studentSubject},
        Где общаемся: ${this.studentCommunication},
        Где проходит: ${this.studentPlatform},
        Стоимость часа: ${this.studentCost},
        Активный: true`);

      this.close();
    } catch (error) {
      console.error('Ошибка при добавлении студента:', error);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}