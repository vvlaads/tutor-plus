import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterOption, SelectedFilter } from '../../app.interfaces';

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
          { value: 'Telegram', text: 'Telegram' },
          { value: 'WhatsApp', text: 'WhatsApp' },
          { value: 'Teams', text: 'Teams' },
          { value: 'Profi', text: 'Profi' },
          { value: 'Авито', text: 'Авито' },
          { value: 'Телефон', text: 'Телефон' },
          { value: 'Сова', text: 'Сова' }
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


  public selectedFilter: SelectedFilter = {
    isPaid: null,
    paidByOwl: null,
    communication: 'all',
    hasNextLesson: null,
  };
  public isDropdownOpen: boolean = false;

  onSearch(): void {
    this.searchChange.emit(this.searchQuery);
  }

  onFilterSelect<K extends keyof SelectedFilter>(key: K, value: SelectedFilter[K]): void {
    this.selectedFilter[key] = value;
    this.isDropdownOpen = false;
    this.filterChange.emit(this.selectedFilter);
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
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
}