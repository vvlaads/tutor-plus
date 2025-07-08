import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  public searchQuery: string = '';

  @Output()
  public searchChange = new EventEmitter<string>();

  public onSearch(): void {
    this.searchChange.emit(this.searchQuery);
  }
}
