import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-faq',
  imports: [NgClass],
  templateUrl: './faq.html',
  styleUrl: './faq.css'
})
export class FAQ {


  activeSection: string = 'ayuda';
  activeView: string = 'puertos';

  showSection(id: string): void {
    this.activeSection = id;
  }

  showView(id: string): void {
    this.activeView = id;
  }

}
