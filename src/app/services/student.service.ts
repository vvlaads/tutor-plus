import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDoc, getDocs, onSnapshot, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { Student } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class StudentService implements OnDestroy {
  private firestore = inject(Firestore);
  private studentsSubject = new BehaviorSubject<Student[]>([]);
  private destroy$ = new Subject<void>();
  students$: Observable<Student[]> = this.studentsSubject.asObservable();

  constructor() {
    this.setupStudentsListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupStudentsListener(): void {
    const studentsRef = collection(this.firestore, 'students');

    const unsubscribe = onSnapshot(studentsRef,
      (querySnapshot) => {
        const students = querySnapshot.docs.map(doc =>
          this.mapDocumentToStudent(doc)
        );
        this.studentsSubject.next(students);
        console.log('Данные студентов обновлены', students);
      },
      (error) => {
        console.error('Ошибка при подписке на студентов:', error);
      }
    );

    // Отписка при уничтожении сервиса
    this.destroy$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      unsubscribe();
    });
  }

  private async refreshStudents() {
    await this.loadStudents();
  }

  async getStudentById(studentId: string): Promise<Student | null> {
    try {
      const studentDoc = doc(this.firestore, 'students', studentId);
      const studentSnapshot = await getDoc(studentDoc);

      if (!studentSnapshot.exists()) {
        console.log('Документ не найден');
        return null;
      }

      return this.mapDocumentToStudent(studentSnapshot);
    } catch (error) {
      console.error('Ошибка при получении документа:', error);
      return null;
    }
  }

  async loadStudents() {
    try {
      const studentsRef = collection(this.firestore, 'students');
      const querySnapshot = await getDocs(studentsRef);

      const students = querySnapshot.docs.map(doc =>
        this.mapDocumentToStudent(doc)
      );

      this.studentsSubject.next(students);
      console.log(`Успешно загружено ${students.length} студентов`);
    } catch (error) {
      console.error('Ошибка при получении студентов:', error);
      this.studentsSubject.next([]);
    }
  }

  async addStudent(studentData: Omit<Student, 'id'>) {
    try {
      const studentsRef = collection(this.firestore, 'students');
      await addDoc(studentsRef, studentData);
      console.log('Студент успешно добавлен');
      await this.refreshStudents();
    } catch (error) {
      console.error('Ошибка при добавлении студента:', error);
      throw error;
    }
  }

  async updateStudent(studentId: string, student: Partial<Student>) {
    try {
      const studentDoc = doc(this.firestore, 'students', studentId);
      await updateDoc(studentDoc, student);
      console.log('Студент успешно обновлен');
      await this.refreshStudents();
    } catch (error) {
      console.error('Ошибка при обновлении студента:', error);
      throw error;
    }
  }

  async deleteStudent(studentId: string) {
    try {
      const studentDoc = doc(this.firestore, 'students', studentId);
      await deleteDoc(studentDoc);
      console.log('Студент успешно удален');
      await this.refreshStudents();
    } catch (error) {
      console.error('Ошибка при удалении студента:', error);
      throw error;
    }
  }

  private mapDocumentToStudent(doc: any): Student {
    const data = doc.data();
    return {
      id: doc.id,
      name: data['name'],
      phone: data['phone'],
      subject: data['subject'],
      communication: data['communication'],
      platform: data['platform'],
      cost: data['cost'],
      isActual: data['isActual']
    };
  }
}