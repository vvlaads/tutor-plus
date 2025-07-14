import { Injectable } from '@angular/core';
import { DialogMode } from '../app.enums';
import { Lesson } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  saved = false;
  mode: DialogMode = DialogMode.Add;
  lesson: Partial<Lesson> | null = null;
  checkCollisions: boolean = true;

  public saveLessonForm(mode: DialogMode, lesson: Partial<Lesson> | null, checkCollisions: boolean): void {
    this.mode = mode;
    this.lesson = lesson;
    this.checkCollisions = checkCollisions;
    this.saved = true;
  }
}
