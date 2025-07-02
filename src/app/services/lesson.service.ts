import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDoc, getDocs, onSnapshot, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { Lesson } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private firestore = inject(Firestore);
  private lessonsSubject = new BehaviorSubject<Lesson[]>([]);
  private destroy$ = new Subject<void>();
  lessons$: Observable<Lesson[]> = this.lessonsSubject.asObservable();

  constructor() {
    this.setupLessonsListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupLessonsListener(): void {
    const lessonsRef = collection(this.firestore, 'lessons');

    const unsubscribe = onSnapshot(lessonsRef,
      (querySnapshot) => {
        const lessons = querySnapshot.docs.map(doc =>
          this.mapDocumentToLesson(doc)
        );
        this.lessonsSubject.next(lessons);
        console.log('Данные занятий обновлены', lessons);
      },
      (error) => {
        console.error('Ошибка при подписке на занятия:', error);
      }
    );

    // Отписка при уничтожении сервиса
    this.destroy$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      unsubscribe();
    });
  }

  private async refreshLessons() {
    await this.loadLessons();
  }

  async getLessonById(lessonId: string): Promise<Lesson | null> {
    try {
      const lessonDoc = doc(this.firestore, 'lessons', lessonId);
      const lessonSnapshot = await getDoc(lessonDoc);

      if (!lessonSnapshot.exists()) {
        console.log('Документ не найден');
        return null;
      }

      return this.mapDocumentToLesson(lessonSnapshot);
    } catch (error) {
      console.error('Ошибка при получении документа:', error);
      return null;
    }
  }

  async loadLessons() {
    try {
      const lessonsRef = collection(this.firestore, 'lessons');
      const querySnapshot = await getDocs(lessonsRef);

      const lessons = querySnapshot.docs.map(doc =>
        this.mapDocumentToLesson(doc)
      );

      this.lessonsSubject.next(lessons);
      console.log(`Успешно загружено ${lessons.length} занятий`);
    } catch (error) {
      console.error('Ошибка при получении занятий:', error);
      this.lessonsSubject.next([]);
    }
  }

  async addLesson(lessonData: Omit<Lesson, 'id'>) {
    try {
      const lessonsRef = collection(this.firestore, 'lessons');
      await addDoc(lessonsRef, lessonData);
      console.log('занятие успешно добавлено');
      await this.refreshLessons();
    } catch (error) {
      console.error('Ошибка при добавлении занятия:', error);
      throw error;
    }
  }

  async updateLesson(lessonId: string, lesson: Partial<Lesson>) {
    try {
      const lessonDoc = doc(this.firestore, 'lessons', lessonId);
      await updateDoc(lessonDoc, lesson);
      console.log('Занятие успешно обновлено');
      await this.refreshLessons();
    } catch (error) {
      console.error('Ошибка при обновлении студента:', error);
      throw error;
    }
  }

  async deleteLesson(lessonId: string) {
    try {
      const lessonDoc = doc(this.firestore, 'lessons', lessonId);
      await deleteDoc(lessonDoc);
      console.log('Занятие успешно удалено');
      await this.refreshLessons();
    } catch (error) {
      console.error('Ошибка при удалении занятия:', error);
      throw error;
    }
  }

  async getLessonsByStudent(studentId: string): Promise<Lesson[]> {
    const currentLessons = this.lessonsSubject.value;
    const studentLessons = currentLessons.filter(lesson => lesson.studentId === studentId);
    return studentLessons;
  }

  private mapDocumentToLesson(doc: any): Lesson {
    const data = doc.data();
    return {
      id: doc.id,
      studentId: data['studentId'],
      date: data['date'],
      startTime: data['startTime'],
      endTime: data['endTime'],
      cost: data['cost'],
      isPaid: data['isPaid']
    };
  }
}
