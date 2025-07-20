import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectOption } from '../../app.interfaces';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.css']
})
export class SearchFilterComponent {
  @Input() filterOptions: SelectOption[] = [
    { value: 'all', text: 'Все' },
    { value: 'today', text: 'Сегодня' },
    { value: 'week', text: 'На неделю' }
  ];

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<string>();

  public searchQuery: string = '';
  public selectedFilter: string = 'all';
  public isDropdownOpen: boolean = false;

  onSearch(): void {
    this.searchChange.emit(this.searchQuery);
  }

  onFilterSelect(value: string): void {
    this.selectedFilter = value;
    this.isDropdownOpen = false;
    this.filterChange.emit(value);
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  get selectedFilterText(): string {
    const found = this.filterOptions.find(o => o.value === this.selectedFilter);
    return found?.text || 'Фильтр';
  }
}