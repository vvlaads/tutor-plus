import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDoc, getDocs, onSnapshot, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { Lesson } from '../app.interfaces';
import { convertStringToDate, convertTimeToMinutes } from '../functions/dates';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class LessonService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private databaseService = inject(DatabaseService);
  private firestore = inject(Firestore);
  private lessonsSubject = new BehaviorSubject<Lesson[]>([]);
  private prevLessonsSubject = new BehaviorSubject<Map<string, Lesson>>(new Map());
  private nextLessonsSubject = new BehaviorSubject<Map<string, Lesson>>(new Map());

  public lessons$ = this.lessonsSubject.asObservable();
  public prevLessons$ = this.prevLessonsSubject.asObservable();
  public nextLessons$ = this.nextLessonsSubject.asObservable();

  constructor() {
    this.initLessonsListener();
  }

  private initLessonsListener(): void {
    this.databaseService.getDatabaseStream('lessons')
      .pipe(
        switchMap(dbName => {
          this.lessonsSubject.next([]);
          if (!dbName) return of([]);
          return this.createCollectionListener(dbName);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(lessons => {
        this.lessonsSubject.next(lessons);
        this.updatePrevAndNextLessons(lessons);
      });
  }

  private createCollectionListener(dbName: string): Observable<Lesson[]> {
    return new Observable<Lesson[]>(subscriber => {
      const unsubscribe = onSnapshot(
        collection(this.firestore, dbName),
        snapshot => {
          const lessons = snapshot.docs.map(doc => this.createLesson(doc));
          subscriber.next(lessons);
        },
        error => console.error('Ошибка загрузки уроков:', error)
      );
      return () => unsubscribe();
    });
  }

  private updatePrevAndNextLessons(lessons: Lesson[]): void {
    const now = new Date();
    const prevLessonsMap = new Map<string, Lesson>();
    const nextLessonsMap = new Map<string, Lesson>();

    const lessonsByStudent = lessons.reduce((acc, lesson) => {
      if (!acc.has(lesson.studentId)) {
        acc.set(lesson.studentId, []);
      }
      acc.get(lesson.studentId)?.push(lesson);
      return acc;
    }, new Map<string, Lesson[]>());

    lessonsByStudent.forEach((studentLessons, studentId) => {
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

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      paidByOwl: data.paidByOwl
    };
  }

  public loadLessons(): void {
    const db = this.databaseService.getDatabaseName('lessons')
    if (db) {
      getDocs(collection(this.firestore, db)).then(() => {
        console.log('Загрузка данных занятий');
      });
    }
  }

  public async getLessons(): Promise<Lesson[]> {
    const db = this.databaseService.getDatabaseName('lessons')
    if (db) {
      const snapshot = await getDocs(collection(this.firestore, db));
      return snapshot.docs.map(this.createLesson);
    }
    return [];
  }

  public async getLessonById(id: string): Promise<Lesson | null> {
    const db = this.databaseService.getDatabaseName('lessons')
    if (db) {
      const docSnap = await getDoc(doc(this.firestore, db, id));
      return docSnap.exists() ? this.createLesson(docSnap) : null;
    }
    return null;
  }

  public async addLesson(lesson: Omit<Lesson, 'id'>): Promise<string> {
    const db = this.databaseService.getDatabaseName('lessons')
    if (db) {
      const docRef = await addDoc(collection(this.firestore, db), lesson);
      return docRef.id;
    }
    return '';
  }

  public async updateLesson(id: string, changes: Partial<Lesson>): Promise<void> {
    const db = this.databaseService.getDatabaseName('lessons')
    if (db) {
      await updateDoc(doc(this.firestore, db, id), changes);
    }
  }

  public async deleteLesson(id: string): Promise<void> {
    const db = this.databaseService.getDatabaseName('lessons')
    if (db) {
      await deleteDoc(doc(this.firestore, db, id));
    }
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

  public async deleteNextLessonsBeforeDateByStudentId(studentId: string, date: Date): Promise<void> {
    const lessons = await this.getNextLessonsBeforeDateByStudentId(studentId, date);
    for (let i = 0; i < lessons.length; i++) {
      this.deleteLesson(lessons[i].id);
    }
  }

  public async getLessonsByStudentId(studentId: string): Promise<Lesson[]> {
    const currentLessons = this.lessonsSubject.value;
    const studentLessons = currentLessons.filter(lesson => lesson.studentId === studentId);
    return studentLessons;
  }

  private getLessonTimestamp(lesson: Lesson): number {
    const date = convertStringToDate(lesson.date);
    date.setHours(0, convertTimeToMinutes(lesson.startTime), 0, 0)
    return date.getTime();
  }

  private getEndLessonTimestamp(lesson: Lesson): number {
    const date = convertStringToDate(lesson.date);
    date.setHours(0, convertTimeToMinutes(lesson.endTime), 0, 0)
    return date.getTime();
  }

  public async getPrevLessonsByStudentId(studentId: string): Promise<Lesson[]> {
    try {
      const now = new Date();
      const studentLessons = await this.getLessonsByStudentId(studentId);

      const prevLessons = studentLessons.filter(lesson => {
        try {
          return this.getEndLessonTimestamp(lesson) < now.getTime();
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
      console.error('Ошибка при получении будущих уроков:', error);
      return [];
    }
  }

  public async getNextLessonsBeforeDateByStudentId(studentId: string, date: Date): Promise<Lesson[]> {
    try {
      const now = new Date();
      const endDate = new Date(date);
      const studentLessons = await this.getLessonsByStudentId(studentId);

      const nextLessons = studentLessons.filter(lesson => {
        try {
          return this.getLessonTimestamp(lesson) > now.getTime() && this.getLessonTimestamp(lesson) < endDate.getTime();
        } catch {
          return false;
        }
      });
      nextLessons.sort((a, b) => this.getLessonTimestamp(b) - this.getLessonTimestamp(a));

      return nextLessons;
    } catch (error) {
      console.error('Ошибка при получении будущих уроков:', error);
      return [];
    }
  }

  public async getUnpaidLessonsByStudentId(studentId: string): Promise<Lesson[]> {
    const studentLessons = await this.getPrevLessonsByStudentId(studentId);
    const unpaidLessons = studentLessons.filter(lesson => !lesson.isPaid);
    unpaidLessons.sort((a, b) => this.getLessonTimestamp(b) - this.getLessonTimestamp(a));

    return unpaidLessons;
  }

  public async getUnpaidOwlLessonsByStudentId(studentId: string): Promise<Lesson[]> {
    const studentLessons = await this.getPrevLessonsByStudentId(studentId);
    const unpaidLessons = studentLessons.filter(lesson => lesson.paidByOwl !== null && !lesson.paidByOwl);
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
