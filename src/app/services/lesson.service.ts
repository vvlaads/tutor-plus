import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDoc, getDocs, onSnapshot, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Lesson } from '../app.interfaces';
import { convertStringToDate, convertTimeToMinutes } from '../functions/dates';

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

  public constructor() {
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

  private findClosestLesson(lessons: Lesson[], now: Date, direction: 'prev' | 'next'): Lesson | null {
    if (lessons.length === 0) return null;

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

    const foundLesson = lessonsWithTimestamps.find(item =>
      direction === 'prev'
        ? new Date(item.timestamp) < now
        : new Date(item.timestamp) > now
    );

    return foundLesson?.lesson || null;
  }

  private findPrevLesson(lessons: Lesson[], now: Date): Lesson | null {
    return this.findClosestLesson(lessons, now, 'prev');
  }

  private findNextLesson(lessons: Lesson[], now: Date): Lesson | null {
    return this.findClosestLesson(lessons, now, 'next');
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
      isRepeat: data.isRepeat || false,
      baseLessonId: data.baseLessonId || null,
      repeatEndDate: data.repeatEndDate || null,
      hasRealEndTime: data.hasRealEndTime || false,
      realEndTime: data.realEndTime || null,
      note: data.note || null,
    };
  }

  public loadLessons(): void {
    getDocs(collection(this.firestore, 'lessons')).then(() => {
      console.log('Загрузка данных занятий');
    });
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

  public async deleteLessonsByStudentId(studentId: string): Promise<void> {
    const lessons = await this.getLessonsByStudentId(studentId);
    for (let i = 0; i < lessons.length; i++) {
      this.deleteLesson(lessons[i].id);
    }
  }

  public async deleteNextLessonsByStudentId(studentId: string): Promise<void> {
    const lessons = await this.getNextLessonsByStudentId(studentId);
    for (let i = 0; i < lessons.length; i++) {
      this.deleteLesson(lessons[i].id);
    }
  }

  public async getLessonsByStudentId(studentId: string): Promise<Lesson[]> {
    const currentLessons = this.lessonsSubject.value;
    const studentLessons = currentLessons.filter(lesson => lesson.studentId === studentId);
    return studentLessons;
  }

  public async getPrevLessonByStudentId(studentId: string): Promise<Lesson | null> {
    const studentLessons = await this.getPrevLessonsByStudentId(studentId);
    if (studentLessons.length === 0) {
      return null;
    }
    return studentLessons[-1];
  }

  public async getNextLessonByStudentId(studentId: string): Promise<Lesson | null> {
    const studentLessons = await this.getNextLessonsByStudentId(studentId);
    if (studentLessons.length === 0) {
      return null;
    }
    return studentLessons[0];
  }

  private getLessonTimestamp(lesson: Lesson): number {
    const date = convertStringToDate(lesson.date);
    date.setHours(0, convertTimeToMinutes(lesson.startTime), 0, 0)
    return date.getTime();
  }

  public async getPrevLessonsByStudentId(studentId: string): Promise<Lesson[]> {
    try {
      const now = new Date();
      const studentLessons = await this.getLessonsByStudentId(studentId);

      const prevLessons = studentLessons.filter(lesson => {
        try {
          return this.getLessonTimestamp(lesson) < now.getTime();
        } catch {
          return false;
        }
      });
      prevLessons.sort((a, b) => this.getLessonTimestamp(b) - this.getLessonTimestamp(a));

      return prevLessons;
    } catch (error) {
      console.error('Ошибка при получении предыдущих уроков:', error);
      return [];
    }
  }

  public async getNextLessonsByStudentId(studentId: string): Promise<Lesson[]> {
    try {
      const now = new Date();
      const studentLessons = await this.getLessonsByStudentId(studentId);

      const nextLessons = studentLessons.filter(lesson => {
        try {
          return this.getLessonTimestamp(lesson) > now.getTime();
        } catch {
          return false;
        }
      });
      nextLessons.sort((a, b) => this.getLessonTimestamp(b) - this.getLessonTimestamp(a));

      return nextLessons;
    } catch (error) {
      console.error('Ошибка при получении предыдущих уроков:', error);
      return [];
    }
  }

  public async getUnpaidLessonsByStudentId(studentId: string): Promise<Lesson[]> {
    const studentLessons = await this.getPrevLessonsByStudentId(studentId);
    const unpaidLessons = studentLessons.filter(lesson => !lesson.isPaid);
    unpaidLessons.sort((a, b) => this.getLessonTimestamp(b) - this.getLessonTimestamp(a));

    return unpaidLessons;
  }

  public async getPrepaidLessonsByStudentId(studentId: string): Promise<Lesson[]> {
    const studentLessons = await this.getNextLessonsByStudentId(studentId);
    const prepaidLessons = studentLessons.filter(lesson => lesson.isPaid);
    prepaidLessons.sort((a, b) => this.getLessonTimestamp(b) - this.getLessonTimestamp(a));

    return prepaidLessons;
  }

  public async getLessonByTime(formattedDate: string, formattedTime: string): Promise<Lesson | null> {
    const lessons = await this.getLessons();
    const result = lessons.filter(lesson => (lesson.date == formattedDate) && (lesson.startTime == formattedTime));
    if (result.length > 0) {
      return result[0];
    }
    return null;
  }

  public async getFutureRepeatedLessons(id: string): Promise<Lesson[]> {
    let lessons: Lesson[] = [];
    const lesson = await this.getLessonById(id);
    if (!lesson) {
      return lessons;
    }
    if (!lesson.baseLessonId || !lesson.isRepeat) {
      return lessons;
    }
    const baseId = lesson.baseLessonId;
    const date = lesson.date;
    lessons = await this.getLessons();
    lessons = lessons
      .filter(lesson => (lesson.baseLessonId == baseId) && (convertStringToDate(lesson.date).getTime() >= convertStringToDate(date).getTime()))
      .sort((a, b) => convertStringToDate(a.date).getTime() - convertStringToDate(b.date).getTime());
    return lessons;
  }
}
