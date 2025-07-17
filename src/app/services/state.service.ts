import { Injectable } from '@angular/core';
import { DialogMode } from '../app.enums';
import { Lesson, WaitingBlock } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  public savedLesson = false;
  public mode: DialogMode = DialogMode.Add;
  public lesson: Partial<Lesson> | null = null;
  public savedWaitingBlock = false;
  public waitingBlock: Partial<WaitingBlock> | null = null;

  public saveLessonForm(mode: DialogMode, lesson: Partial<Lesson> | null): void {
    this.mode = mode;
    this.lesson = lesson;
    this.savedLesson = true;
  }

  public saveWaitingBlockForm(mode: DialogMode, waitingBlock: Partial<WaitingBlock> | null): void {
    this.mode = mode;
    this.waitingBlock = waitingBlock;
    this.savedWaitingBlock = true;
  }

  public removedAllFlags(): void {
    this.savedLesson = false;
    this.savedWaitingBlock = false;
  }
}
