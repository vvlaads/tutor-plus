import { Component, inject, OnInit } from '@angular/core';
import { DeviceService } from '../../services/device.service';
import { LayoutService } from '../../services/layout.service';
import { CommonModule } from '@angular/common';
import { MONTH_NAMES, WEEKDAY_NAMES } from '../../app.constants';
import { DialogService } from '../../services/dialog.service';
import { DialogMode } from '../../app.enums';
import { WaitingBlock } from '../../app.interfaces';
import { WaitingBlockService } from '../../services/waiting-block.service';
import { convertStringToDate, isDatesEquals } from '../../functions/dates';

@Component({
  selector: 'app-wait-list',
  imports: [CommonModule],
  templateUrl: './wait-list.component.html',
  styleUrl: './wait-list.component.css'
})
export class WaitListComponent implements OnInit {
  public pageMarginLeftPercentage: number = 0;
  private deviceService = inject(DeviceService);
  public deviceType$ = this.deviceService.deviceType$;

  public monthNames: string[] = MONTH_NAMES;
  public weekDayNames: string[] = WEEKDAY_NAMES;
  public currentDate: Date = new Date();
  public today: Date = new Date();
  public currentWeekDates: Date[] = [];
  public waitingBlocks: WaitingBlock[] = []
  public blocksInDay: WaitingBlock[][] = [];
  public blocksPosition: number[] = [];

  public constructor(private layoutService: LayoutService, private dialogService: DialogService, private waitingBlockService: WaitingBlockService) {
    this.layoutService.pageMarginLeftPercentage$.subscribe(pageMarginLeftPercentage => {
      this.pageMarginLeftPercentage = pageMarginLeftPercentage;
    })
    this.subscribeToWaitingBlocks();
  }

  public ngOnInit(): void {
    this.updateCurrentWeek();
  }

  private subscribeToWaitingBlocks(): void {
    this.waitingBlockService.loadWaitingBlocks();
    this.waitingBlockService.waitingBlocks$.subscribe(waitingBlocks => {
      this.waitingBlocks = waitingBlocks;
      this.updateWaitingBlocks();
    })
  }

  private updateCurrentWeek(): void {
    const monday = new Date(this.currentDate);
    const dayOfWeek = this.currentDate.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(this.currentDate.getDate() - diff);

    this.currentWeekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  }

  private updateWaitingBlocks(): void {
    this.waitingBlocks = this.waitingBlocks.filter(waitingBlock =>
      this.currentWeekDates.some(date => isDatesEquals(convertStringToDate(waitingBlock.date), date))
    );

    this.blocksInDay = [];
    for (let i = 0; i < this.weekDayNames.length; i++) {
      this.blocksPosition[i] = 0;
      this.blocksInDay[i] = this.waitingBlocks.filter(waitingBlock =>
        isDatesEquals(convertStringToDate(waitingBlock.date), this.currentWeekDates[i])
      );
    }
  }

  public getMaxLengthIndexes(): number[] {
    let max = 0;
    for (let array of this.blocksInDay) {
      if (array.length > max) {
        max = array.length;
      }
    }

    return Array.from({ length: max }, (_, i) => i);
  }

  public getNextByDayIndex(index: number): WaitingBlock | null {
    if (this.blocksPosition[index] < this.blocksInDay[index].length) {
      return this.blocksInDay[index][this.blocksPosition[index]++];
    }
    return null;
  }

  private updateCurrentDate(newDate: Date): void {
    this.currentDate = new Date(newDate);
    this.updateCurrentWeek();
  }

  public getFormatDate(date: Date) {
    return `${date.getDate()} ${this.monthNames[date.getMonth()]}`;
  }

  public addWaitingBlock(): void {
    this.dialogService.openWaitingBlockDialog(DialogMode.Add, null);
  }
}