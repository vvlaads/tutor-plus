import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDoc, getDocs, onSnapshot, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Lesson } from '../app.interfaces';
import { DateService } from './date.service';

@Injectable({
  providedIn: 'root'
})
export class LessonService implements OnDestroy {
  private firestore = inject(Firestore);
  private unsubscribe!: () => void;
  private lessonsSubject = new BehaviorSubject<Lesson[]>([]);
  private prevLessonsSubject = new BehaviorSubject<Map<string, Lesson>>(new Map());
  private nextLessonsSubject = new BehaviorSubject<Map<string, Lesson>>(new Map());

  public lessons$ = this.lessonsSubject.asObservable();
  public prevLessons$ = this.prevLessonsSubject.asObservable();
  public nextLessons$ = this.nextLessonsSubject.asObservable();

  public constructor(private dateService: DateService) {
    this.startListening();
  }

  public ngOnDestroy(): void {
    this.stopListening();
  }

  private startListening(): void {
    const lessonsRef = collection(this.firestore, 'lessons');

    this.unsubscribe = onSnapshot(lessonsRef, {
      next: (snapshot) => {
        const lessons = snapshot.docs.map(this.createLesson);
        this.lessonsSubject.next(lessons);
        this.updatePrevAndNextLessons(lessons);
      },
      error: (err) => console.error('Ошибка загрузки:', err)
    });
  }

  private updatePrevAndNextLessons(lessons: Lesson[]): void {
    const now = new Date();
    const prevLessonsMap = new Map<string, Lesson>();
    const nextLessonsMap = new Map<string, Lesson>();

    const studentIds = [...new Set(lessons.map(lesson => lesson.studentId))];

    studentIds.forEach(studentId => {
      const studentLessons = lessons.filter(lesson => lesson.studentId === studentId);

      const prevLesson = this.findPrevLesson(studentLessons, now);
      if (prevLesson) {
        prevLessonsMap.set(studentId, prevLesson);
      }

      const nextLesson = this.findNextLesson(studentLessons, now);
      if (nextLesson) {
        nextLessonsMap.set(studentId, nextLesson);
      }
    });

    this.prevLessonsSubject.next(prevLessonsMap);
    this.nextLessonsSubject.next(nextLessonsMap);
  }

  private stopListening(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private createLesson(doc: any): Lesson {
    const data = doc.data();
    return {
      id: doc.id,
      studentId: data.studentId || '',
      date: data.date || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      cost: data.cost || 0,
      isPaid: data.isPaid || false,
      realEndTime: data.realEndTime || ''
    };
  }


  public async getLessons(): Promise<Lesson[]> {
    const snapshot = await getDocs(collection(this.firestore, 'lessons'));
    return snapshot.docs.map(this.createLesson);
  }

  public async getLessonById(id: string): Promise<Lesson | null> {
    const docSnap = await getDoc(doc(this.firestore, 'lessons', id));
    return docSnap.exists() ? this.createLesson(docSnap) : null;
  }

  public async addLesson(lesson: Omit<Lesson, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'lessons'), lesson);
    return docRef.id;
  }

  public async updateLesson(id: string, changes: Partial<Lesson>): Promise<void> {
    await updateDoc(doc(this.firestore, 'lessons', id), changes);
  }

  public async deleteLesson(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'lessons', id));
  }

  private findClosestLesson(lessons: Lesson[], now: Date, direction: 'prev' | 'next'): Lesson | null {
    if (lessons.length === 0) return null;

    try {
      const lessonsWithTimestamps = lessons
        .filter(lesson => !!lesson.date && !!lesson.startTime)
        .map(lesson => ({
          lesson,
          timestamp: this.getLessonTimestamp(lesson)
        }));

      if (lessonsWithTimestamps.length === 0) return null;

      lessonsWithTimestamps.sort((a, b) =>
        direction === 'prev'
          ? b.timestamp - a.timestamp
          : a.timestamp - b.timestamp
      );

      const foundLesson = lessonsWithTimestamps.find(item => {
        try {
          return direction === 'prev'
            ? new Date(item.timestamp) < now
            : new Date(item.timestamp) > now;
        } catch {
          return false;
        }
      });

      return foundLesson?.lesson || null;
    } catch (error) {
      console.error(`Ошибка при поиске ${direction === 'prev' ? 'предыдущего' : 'следующего'} занятия:`, error);
      return null;
    }
  }

  private findPrevLesson(lessons: Lesson[], now: Date): Lesson | null {
    return this.findClosestLesson(lessons, now, 'prev');
  }

  private findNextLesson(lessons: Lesson[], now: Date): Lesson | null {
    return this.findClosestLesson(lessons, now, 'next');
  }

  public async getLessonsByStudentId(studentId: string): Promise<Lesson[]> {
    const currentLessons = this.lessonsSubject.value;
    const studentLessons = currentLessons.filter(lesson => lesson.studentId === studentId);
    return studentLessons;
  }

  public async getPrevLessonByStudentId(studentId: string) {
    const now = new Date();
    const studentLessons = await this.getLessonsByStudentId(studentId);
    return this.findPrevLesson(studentLessons, now)
  }

  public async getNextLessonByStudentId(studentId: string) {
    const now = new Date();
    const studentLessons = await this.getLessonsByStudentId(studentId);
    return this.findNextLesson(studentLessons, now)
  }

  private getLessonTimestamp(lesson: Lesson): number {
    const date = this.dateService.stringToDate(lesson.date);
    date.setHours(0, this.dateService.stringToMinutes(lesson.startTime), 0, 0)
    return date.getTime();
  }
}
