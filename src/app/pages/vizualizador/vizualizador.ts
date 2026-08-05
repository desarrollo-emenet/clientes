import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgIf, Location } from '@angular/common';
import { UserService } from '../../services/user/user-service';

@Component({
  selector: 'app-vizualizador',
  imports: [NgIf],
  templateUrl: './vizualizador.html',
  styleUrl: './vizualizador.css'
})
export class Vizualizador {
  urlNueva!: SafeResourceUrl;
  segundosRestantes: number = 60;
  porcentajeTiempo: number = 100;
  intervaloRef: any;

  constructor(private router: Router, private sanitizer: DomSanitizer, private location: Location, private user: UserService) {
    const navegacion = this.router.getCurrentNavigation();
    // Obtiene la URL del PDF desde el estado de navegación de cliente
    const urlApi = navegacion?.extras.state?.['pdfUrl'];
    if (urlApi) {
      this.urlNueva = this.sanitizer.bypassSecurityTrustResourceUrl(urlApi);
    }
  }
  ngOnInit(): void {
    if (!this.urlNueva) {
      this.navigateTo('estadoCuenta');
      return;
    }
    this.iniciarTemporizador();
  }

  //expira en 1 minuto y regresa a estado de cuenta
  iniciarTemporizador(): void {
    this.intervaloRef = setInterval(() => {
      this.segundosRestantes--;
      this.porcentajeTiempo = (this.segundosRestantes / 60) * 100;

      if (this.segundosRestantes <= 0) {
        this.navigateTo('estadoCuenta');
      }
    }, 1000);
  }


  navigateTo(route: string): void {
    const numeroCliente = this.user.obtenerServicioActivo();
    this.router.navigate([route, numeroCliente]);
  }


  ngOnDestroy(): void {
    if (this.intervaloRef) {
      clearInterval(this.intervaloRef);
    }
  }
}
