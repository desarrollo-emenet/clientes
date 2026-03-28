import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
  selector: 'app-email-verificado',
  standalone: true,
  imports: [NgxSonnerToaster, CommonModule],
  templateUrl: './email-verificado.html',
  styleUrl: './email-verificado.css'
})
export class EmailVerificado implements OnInit {
  countdown: number = 8;
  isFlipping: boolean = false;

  constructor(private router: Router) { }

  ngOnInit(): void {
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(interval);
        if (!this.isFlipping) {
          this.goToUrl('/iniciar-sesion');
        }
      }
    }, 1000);
  }

  goToUrl(url: string): void {
    this.isFlipping = true;
    setTimeout(() => {
      this.router.navigate([url]);
    }, 650);
  }
}
