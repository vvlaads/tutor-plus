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
  public checkCollisions: boolean = true;
  public savedWaitingBlock = false;
  public waitingBlock: Partial<WaitingBlock> | null = null;

  public saveLessonForm(mode: DialogMode, lesson: Partial<Lesson> | null, checkCollisions: boolean): void {
    this.mode = mode;
    this.lesson = lesson;
    this.checkCollisions = checkCollisions;
    this.savedLesson = true;
  }

  public saveWaitingBlockForm(mode: DialogMode, waitingBlock: Partial<WaitingBlock> | null): void {
    this.mode = mode;
    this.waitingBlock = waitingBlock;
    this.savedWaitingBlock = true;
  }
}
