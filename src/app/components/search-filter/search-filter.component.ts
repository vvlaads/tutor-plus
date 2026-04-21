import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterOption, SelectedFilter } from '../../app.interfaces';
import { COMMUNICATION_OPTIONS } from '../../app.constants';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.css']
})
export class SearchFilterComponent {
  filterGroups: {
    key: keyof SelectedFilter;
    label: string;
    options: FilterOption[];
  }[] = [
      {
        key: 'communication',
        label: 'Переписка',
        options: [
          { value: 'all', text: 'Все' },
          ...COMMUNICATION_OPTIONS.map(o => ({
            value: o.value,
            text: o.text
          }))
        ]
      },
      {
        key: 'isPaid',
        label: 'Оплата',
        options: [
          { value: null, text: 'Все' },
          { value: true, text: 'Оплачено' },
          { value: false, text: 'Не оплачено' }
        ]
      },
      {
        key: 'paidByOwl',
        label: 'Оплата по сове',
        options: [
          { value: null, text: 'Все' },
          { value: true, text: 'Оплачено' },
          { value: false, text: 'Не оплачено' }
        ]
      },
      {
        key: 'hasNextLesson',
        label: 'Следующие уроки',
        options: [
          { value: null, text: 'Все' },
          { value: true, text: 'Есть' },
          { value: false, text: 'Нет' }
        ]
      }
    ]

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<any>();

  public searchQuery: string = '';


  @Input() selectedFilter!: SelectedFilter;
  public isDropdownOpen: boolean = false;

  constructor(private elementRef: ElementRef) { }

  onSearch(): void {
    this.searchChange.emit(this.searchQuery);
  }

  onFilterSelect<K extends keyof SelectedFilter>(key: K, value: SelectedFilter[K]): void {
    this.filterChange.emit({
      ...this.selectedFilter,
      [key]: value
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  get hasActiveFilters(): boolean {
    return (
      this.selectedFilter.communication !== 'all' ||
      this.selectedFilter.isPaid !== null ||
      this.selectedFilter.paidByOwl !== null ||
      this.selectedFilter.hasNextLesson !== null
    );
  }

  resetFilters(event: MouseEvent): void {
    event.stopPropagation(); // важно — чтобы dropdown не открывался/закрывался

    this.selectedFilter = {
      communication: 'all',
      isPaid: null,
      paidByOwl: null,
      hasNextLesson: null,
    };

    this.filterChange.emit(this.selectedFilter);
  }

  get selectedFilterText(): string {
    const parts: string[] = [];
    if (this.selectedFilter.communication !== 'all') {
      parts.push(this.selectedFilter.communication);
    }

    if (this.selectedFilter.isPaid !== null) {
      parts.push(this.selectedFilter.isPaid ? 'Оплачено' : 'Не оплачено');
    }

    if (this.selectedFilter.paidByOwl !== null) {
      parts.push(this.selectedFilter.paidByOwl ? 'Оплачено по сове' : 'Не оплачено по сове')
    }

    if (this.selectedFilter.hasNextLesson !== null) {
      parts.push(this.selectedFilter.hasNextLesson ? 'Есть следующие занятия' : 'Нет следующих занятий')
    }

    if (parts.length === 1) {
      return parts[0];
    }
    return parts.length ? `Фильтры (${parts.length})` : 'Фильтр';
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.isDropdownOpen = false;
    }
  }
}