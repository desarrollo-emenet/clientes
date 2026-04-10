import { Component, EventEmitter, Output } from '@angular/core';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-header',
  imports: [UserMenuComponent],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleheader = new EventEmitter<void>();

  onHamburgerClick() {
    this.toggleSidebar.emit();
  }

  onHamburger1Click() {
    this.toggleheader.emit();
  }

}
