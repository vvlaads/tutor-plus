import { inject, Injectable, OnDestroy } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDoc, getDocs, onSnapshot, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { Lesson } from '../app.interfaces';
import { DateService } from './date.service';

@Injectable({
  providedIn: 'root'
})
export class LessonService implements OnDestroy {
  private firestore = inject(Firestore);
  private lessonsSubject = new BehaviorSubject<Lesson[]>([]);
  private destroy$ = new Subject<void>();
  public lessons$: Observable<Lesson[]> = this.lessonsSubject.asObservable();

  private prevLessonsCache = new BehaviorSubject<Map<string, Lesson | null>>(new Map());
  private nextLessonsCache = new BehaviorSubject<Map<string, Lesson | null>>(new Map());

  public prevLessons$ = this.prevLessonsCache.asObservable();
  public nextLessons$ = this.nextLessonsCache.asObservable();

  public constructor(private dateService: DateService) {
    this.setupLessonsListener();
    this.setupLessonsCacheUpdater();
  }

  private setupLessonsCacheUpdater(): void {
    this.lessons$.subscribe(lessons => {
      this.updateLessonsCache(lessons);
    });
  }

  private updateLessonsCache(lessons: Lesson[]): void {
    try {
      const studentIds = [...new Set(lessons.map(l => l.studentId))];
      const now = new Date();

      const newPrevMap = new Map<string, Lesson | null>();
      const newNextMap = new Map<string, Lesson | null>();

      // Обрабатываем случай, когда lessons пустой
      if (lessons.length === 0) {
        this.prevLessonsCache.next(newPrevMap);
        this.nextLessonsCache.next(newNextMap);
        return;
      }

      studentIds.forEach(studentId => {
        try {
          const studentLessons = lessons.filter(l => l.studentId === studentId);

          // Явно обрабатываем случай, когда у студента нет занятий
          if (studentLessons.length === 0) {
            newPrevMap.set(studentId, null);
            newNextMap.set(studentId, null);
            return;
          }

          const prevLesson = this.findPrevLesson(studentLessons, now);
          newPrevMap.set(studentId, prevLesson);

          const nextLesson = this.findNextLesson(studentLessons, now);
          newNextMap.set(studentId, nextLesson);
        } catch (error) {
          console.error(`Error processing lessons for student ${studentId}:`, error);
          newPrevMap.set(studentId, null);
          newNextMap.set(studentId, null);
        }
      });

      this.prevLessonsCache.next(newPrevMap);
      this.nextLessonsCache.next(newNextMap);
    } catch (error) {
      console.error('Error updating lessons cache:', error);
      // В случае ошибки инициализируем пустые кэши
      this.prevLessonsCache.next(new Map());
      this.nextLessonsCache.next(new Map());
    }
  }


  private findPrevLesson(lessons: Lesson[], now: Date): Lesson | null {
    if (!lessons || lessons.length === 0) return null;

    try {
      const lessonsWithTimestamps = lessons
        .filter(lesson => !!lesson.date && !!lesson.startTime) // Фильтруем некорректные данные
        .map(lesson => ({
          lesson,
          timestamp: this.getLessonTimestamp(lesson)
        }));

      if (lessonsWithTimestamps.length === 0) return null;

      lessonsWithTimestamps.sort((a, b) => b.timestamp - a.timestamp);
      const prevLesson = lessonsWithTimestamps.find(item => {
        try {
          return new Date(item.timestamp) < now;
        } catch {
          return false;
        }
      });

      return prevLesson?.lesson || null;
    } catch (error) {
      console.error('Error finding previous lesson:', error);
      return null;
    }
  }

  private findNextLesson(lessons: Lesson[], now: Date): Lesson | null {
    if (!lessons || lessons.length === 0) return null;

    try {
      const lessonsWithTimestamps = lessons
        .filter(lesson => !!lesson.date && !!lesson.startTime) // Фильтруем некорректные данные
        .map(lesson => ({
          lesson,
          timestamp: this.getLessonTimestamp(lesson)
        }));

      if (lessonsWithTimestamps.length === 0) return null;

      lessonsWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);
      const nextLesson = lessonsWithTimestamps.find(item => {
        try {
          return new Date(item.timestamp) > now;
        } catch {
          return false;
        }
      });

      return nextLesson?.lesson || null;
    } catch (error) {
      console.error('Error finding next lesson:', error);
      return null;
    }
  }

  public ngOnDestroy(): void {
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

    this.destroy$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      unsubscribe();
    });
  }

  private async loadLessons(): Promise<void> {
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

  private async refreshLessons(): Promise<void> {
    await this.loadLessons();
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
      isPaid: data['isPaid'],
      realEndTime: data['realEndTime']
    };
  }

  public async getLessonById(lessonId: string): Promise<Lesson | null> {
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

  public async addLesson(lessonData: Omit<Lesson, 'id'>): Promise<void> {
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

  public async updateLesson(lessonId: string, lesson: Partial<Lesson>): Promise<void> {
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

  public async deleteLesson(lessonId: string): Promise<void> {
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

  public async getLessonsByStudentId(studentId: string): Promise<Lesson[]> {
    const currentLessons = this.lessonsSubject.value;
    const studentLessons = currentLessons.filter(lesson => lesson.studentId === studentId);
    return studentLessons;
  }

  public async getPrevLessonByStudentId(studentId: string): Promise<Lesson | null> {
    const currentLessons = this.lessonsSubject.value;
    const now = new Date();

    const lessonsWithTimestamps = currentLessons
      .filter(lesson => lesson.studentId === studentId)
      .map(lesson => ({
        lesson,
        timestamp: this.getLessonTimestamp(lesson)
      }));

    lessonsWithTimestamps.sort((a, b) => b.timestamp - a.timestamp);

    const prevLesson = lessonsWithTimestamps.find(item => {
      const lessonDate = new Date(item.timestamp);
      return lessonDate < now;
    });

    return prevLesson ? prevLesson.lesson : null;
  }

  private getLessonTimestamp(lesson: Lesson): number {
    const date = this.dateService.stringToDate(lesson.date);
    date.setHours(0, this.dateService.stringToMinutes(lesson.startTime), 0, 0)
    return date.getTime();
  }
}
