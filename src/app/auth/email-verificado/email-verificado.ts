import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  yaVerificado: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.yaVerificado = this.route.snapshot.queryParams['yaVerificado'] === 'true';

    if (this.yaVerificado) return;

    const intervalo = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(intervalo);
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

