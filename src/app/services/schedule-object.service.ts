import { inject, Injectable } from '@angular/core';
import { LessonService } from './lesson.service';
import { SlotService } from './slot.service';
import { Lesson, Slot } from '../app.interfaces';
import { hasOverlay } from '../functions/dates';

@Injectable({
  providedIn: 'root'
})
export class ScheduleObjectService {
  private lessonService = inject(LessonService);
  private slotService = inject(SlotService);

  public async addLesson(lesson: Omit<Lesson, 'id'>): Promise<string | null> {
    const lessons = await this.lessonService.getLessons();
    for (let l of lessons) {
      if (hasOverlay(lesson, l)) {
        return null;
      }
    }

    const slots = await this.slotService.getSlots();
    for (let slot of slots) {
      if (hasOverlay(lesson, slot)) {
        await this.slotService.deleteSlot(slot.id);
      }
    }
    return this.lessonService.addLesson(lesson);
  }

  public async updateLesson(id: string, changes: Partial<Lesson>): Promise<boolean> {
    const oldLesson = await this.lessonService.getLessonById(id);
    if (oldLesson) {
      const lesson: Lesson = { ...oldLesson, ...changes }
      const lessons = await this.lessonService.getLessons();
      for (let l of lessons) {
        if (l.id === id) { continue; }
        if (hasOverlay(lesson, l)) {
          return false;
        }
      }

      const slots = await this.slotService.getSlots();;
      for (let slot of slots) {
        if (hasOverlay(lesson, slot)) {
          await this.slotService.deleteSlot(slot.id);
        }
      }
      return this.lessonService.updateLesson(id, changes);
    }
    return false;
  }

  public async addSlot(slot: Omit<Slot, 'id'>): Promise<string | null> {
    const lessons = await this.lessonService.getLessons();
    for (let l of lessons) {
      if (hasOverlay(slot, l)) {
        return null;
      }
    }

    const slots = await this.slotService.getSlots();
    for (let s of slots) {
      if (hasOverlay(slot, s)) {
        return null;
      }
    }
    return this.slotService.addSlot(slot);
  }

  public async updateSlot(id: string, changes: Partial<Slot>): Promise<boolean> {
    const oldSlot = await this.slotService.getSlotById(id);
    if (oldSlot) {
      const slot: Slot = { ...oldSlot, ...changes }

      const slots = await this.slotService.getSlots();
      for (let s of slots) {
        if (s.id === id) { continue; }
        if (hasOverlay(slot, s)) {
          return false;
        }
      }

      const lessons = await this.lessonService.getLessons();
      for (let lesson of lessons) {
        if (hasOverlay(lesson, slot)) {
          return false;
        }
      }

      return this.slotService.updateSlot(id, changes);
    }
    return false;
  }
}
