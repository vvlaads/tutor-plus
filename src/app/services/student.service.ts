import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDoc, updateDoc, deleteDoc, onSnapshot, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { Student } from '../app.interfaces';
import { LessonService } from './lesson.service';
import { convertStringToDate } from '../functions/dates';
import { DatabaseService } from './database.service';

@Injectable({ providedIn: 'root' })
export class StudentService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private studentsSubject = new BehaviorSubject<Student[]>([]);
  private databaseService = inject(DatabaseService);

  public students$ = this.databaseService
    .getDatabaseStream('students')
    .pipe(
      switchMap(dbName => {
        this.studentsSubject.next([]);
        if (!dbName) return of([]);
        return this.createCollectionListener(dbName);
      }),
      takeUntil(this.destroy$)
    );

  public constructor(private firestore: Firestore, private lessonService: LessonService) {
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createCollectionListener(dbName: string): Observable<Student[]> {
    return new Observable<Student[]>(subscriber => {
      const unsubscribe = onSnapshot(
        collection(this.firestore, dbName),
        snapshot => {
          const students = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Student));
          subscriber.next(students);
        },
        error => console.error('Ошибка загрузки студентов:', error)
      );

      return () => unsubscribe();
    });
  }

  private createStudent(doc: any): Student {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || 'Без имени',
      phone: data.phone || null,
      subject: data.subject || '',
      communication: data.communication || '',
      platform: data.platform || '',
      cost: data.cost || 0,
      isActive: data.isActive !== false,
      from: data.from || '',
      color: data.color || '#ffffff',
      hasParent: data.hasParent || false,
      parentName: data.parentName || null,
      parentPhone: data.parentPhone || null,
      parentCommunication: data.parentCommunication || null,
      paidByStudent: data.paidByStudent,
      isStopped: data.isStopped || false,
      stopDate: data.stopDate || null,
      note: data.note || null
    };
  }

  public async getStudents(): Promise<Student[]> {
    const db = this.databaseService.getDatabaseName('students')
    if (db) {
      const snapshot = await getDocs(collection(this.firestore, db));
      return snapshot.docs.map(this.createStudent);
    }
    return [];
  }

  public async getStudentById(id: string): Promise<Student | null> {
    const db = this.databaseService.getDatabaseName('students')
    if (db) {
      const docSnap = await getDoc(doc(this.firestore, db, id));
      return docSnap.exists() ? this.createStudent(docSnap) : null;
    }
    return null;
  }

  public async addStudent(student: Omit<Student, 'id'>): Promise<string> {
    const db = this.databaseService.getDatabaseName('students')
    if (db) {
      const docRef = await addDoc(collection(this.firestore, db), student);
      this.checkNextLessons(docRef.id);
      return docRef.id;
    }
    return '';
  }

  public async updateStudent(id: string, changes: Partial<Student>): Promise<void> {
    const db = this.databaseService.getDatabaseName('students')
    if (db) {
      await updateDoc(doc(this.firestore, db, id), changes);
      this.checkNextLessons(id);
    }
  }

  public async deleteStudent(id: string): Promise<void> {
    const db = this.databaseService.getDatabaseName('students')
    if (db) {
      await deleteDoc(doc(this.firestore, db, id));
      this.lessonService.deleteLessonsByStudentId(id);
    }
  }

  private async checkNextLessons(id: string): Promise<void> {
    const student = await this.getStudentById(id);
    if (student) {
      if (!student.isActive) {
        this.lessonService.deleteNextLessonsByStudentId(id);
      }
      else if (student.isStopped && student.stopDate) {
        const date = convertStringToDate(student.stopDate);
        this.lessonService.deleteNextLessonsBeforeDateByStudentId(id, date);
      }
    }
  }
}