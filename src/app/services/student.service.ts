import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDoc, updateDoc, deleteDoc, onSnapshot, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Student } from '../app.interfaces';
import { LessonService } from './lesson.service';

@Injectable({ providedIn: 'root' })
export class StudentService implements OnDestroy {
  private firestore = inject(Firestore);
  private unsubscribe!: () => void;
  private studentsSubject = new BehaviorSubject<Student[]>([]);

  public students$ = this.studentsSubject.asObservable();

  public constructor(private lessonService: LessonService) {
    this.startListening();
  }

  public ngOnDestroy(): void {
    this.stopListening();
  }

  private startListening(): void {
    const studentsRef = collection(this.firestore, 'students');

    this.unsubscribe = onSnapshot(studentsRef, {
      next: (snapshot) => {
        const students = snapshot.docs.map(this.createStudent);
        this.studentsSubject.next(students);
      },
      error: (err) => console.error('Ошибка загрузки:', err)
    });
  }

  private stopListening(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private createStudent(doc: any): Student {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || 'Без имени',
      phone: data.phone || '',
      subject: data.subject || '',
      communication: data.communication || '',
      platform: data.platform || '',
      cost: data.cost || 0,
      isActive: data.isActive !== false,
      from: data.from || '',
      color: data.color || '#ffffff'
    };
  }

  public loadStudents(): void {
    getDocs(collection(this.firestore, 'students')).then(() => {
      console.log('Загрузка данных учеников');
    });
  }

  public async getStudents(): Promise<Student[]> {
    const snapshot = await getDocs(collection(this.firestore, 'students'));
    return snapshot.docs.map(this.createStudent);
  }

  public async getStudentById(id: string): Promise<Student | null> {
    const docSnap = await getDoc(doc(this.firestore, 'students', id));
    return docSnap.exists() ? this.createStudent(docSnap) : null;
  }

  public async addStudent(student: Omit<Student, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'students'), student);
    this.checkNextLessons(docRef.id);
    return docRef.id;
  }

  public async updateStudent(id: string, changes: Partial<Student>): Promise<void> {
    await updateDoc(doc(this.firestore, 'students', id), changes);
    this.checkNextLessons(id);
  }

  public async deleteStudent(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'students', id));
    this.lessonService.deleteLessonsByStudentId(id);
  }

  private async checkNextLessons(id: string): Promise<void> {
    const student = await this.getStudentById(id);
    if (student) {
      if (!student.isActive) {
        this.lessonService.deleteNextLessonsByStudentId(id);
      }
    }
  }
}