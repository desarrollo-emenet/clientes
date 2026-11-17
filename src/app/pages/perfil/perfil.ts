import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { ObservableService } from '../../services/utility/observable.service';
import { UserService } from '../../services/user/user-service';
import { firstValueFrom } from 'rxjs';
import { Avatar } from 'primeng/avatar';
import { Router, RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';
import { ClientService } from '../../services/user/clientService';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from '../../services/utility/http.service';
import { infoCliente } from '../../models/info-cliente';
import { FormsModule } from '@angular/forms';
import { LoginS } from '../../services/auth/login';
import { Preloader } from '../../shared/preloader/preloader';

export interface AvatarStyle {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'static' | 'animated';
}

@Component({
  selector: 'app-perfil',
  imports: [NgIf, Avatar, RouterLink, NgFor, FormsModule, DatePipe, Preloader],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil {
  @ViewChild('stylesNav') stylesNavRef?: ElementRef<HTMLDivElement>;

  clienteAv: { nombre: string; cliente: string; avatarUrl: string | null; } = {
    nombre: '',
    cliente: '',
    avatarUrl: null
  };

  fechaRegistro: Date | string | null = null;

  readonly avatarSeeds: string[] = [
    'Mia',
    'Max',
    'Charlie',
    'Lucy',
    'Leo',
    'Zoe',
    'Oliver',
    'Emma',
    'Lucas',
    'Sophia',
    'Mateo',
    'Elena',
    'Liam',
    'Olivia',
    'Noah',
    'Ava',
    'Helen',
    'Alex',
    'Daniel',
    'Sofia',
    'Diego',
    'Valentina',
    'Samuel',
    'Camila',
  ];

  readonly staticStyles: AvatarStyle[] = [
    {
      id: 'adventurer',
      name: 'Adventurer',
      description: 'Personajes ilustrados y expresivos',
      category: 'Personas',
      type: 'static',
    },
    {
      id: 'adventurer-neutral',
      name: 'Adventurer Neutral',
      description: 'Personajes con estilo neutro',
      category: 'Personas',
      type: 'static',
    },
    {
      id: 'avataaars',
      name: 'Avataaars',
      description: 'Avatares personalizables de personas',
      category: 'Personas',
      type: 'static',
    },
    {
      id: 'big-ears',
      name: 'Big Ears',
      description: 'Personajes con orejas grandes',
      category: 'Personas',
      type: 'static',
    },
    {
      id: 'big-smile',
      name: 'Big Smile',
      description: 'Caras sonrientes y amigables',
      category: 'Personas',
      type: 'static',
    },
    {
      id: 'bottts',
      name: 'Bottts',
      description: 'Robots ilustrados clásicos',
      category: 'Robots',
      type: 'static',
    },
    {
      id: 'bottts-neutral',
      name: 'Bottts Neutral',
      description: 'Robots con apariencia neutra',
      category: 'Robots',
      type: 'static',
    },
    {
      id: 'croodles',
      name: 'Croodles',
      description: 'Personajes de trazos informales',
      category: 'Ilustraciones',
      type: 'static',
    },
    {
      id: 'croodles-neutral',
      name: 'Croodles Neutral',
      description: 'Dibujos hechos a mano',
      category: 'Ilustraciones',
      type: 'static',
    },
    {
      id: 'fun-emoji',
      name: 'Fun Emoji',
      description: 'Emojis divertidos y expresivos',
      category: 'Emojis',
      type: 'static',
    },
    {
      id: 'micah',
      name: 'Micah',
      description: 'Retratos ilustrados modernos',
      category: 'Personas',
      type: 'static',
    },
    {
      id: 'open-peeps',
      name: 'Open Peeps',
      description: 'Personajes dibujados a mano',
      category: 'Personas',
      type: 'static',
    },
    {
      id: 'personas',
      name: 'Personas',
      description: 'Retratos elegantes para perfiles',
      category: 'Personas',
      type: 'static',
    },
    {
      id: 'pixel-art',
      name: 'Pixel Art',
      description: 'Personajes clásicos en pixel art',
      category: 'Pixel Art',
      type: 'static',
    },
    {
      id: 'thumbs',
      name: 'Thumbs',
      description: 'Avatares con pulgares y formas',
      category: 'Creativos',
      type: 'static',
    },
    {
      id: 'toon-head',
      name: 'Toon Head',
      description: 'Cabezas de personajes de caricatura',
      category: 'Personas',
      type: 'static',
    },
  ];

  readonly animatedStyles: AvatarStyle[] = [
    {
      id: 'clay',
      name: 'Clay',
      description: 'Personajes 3D en plastilina animados',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'critters',
      name: 'Critters',
      description: 'Criaturas animadas fantásticas',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'pixelbot',
      name: 'Pixelbot',
      description: 'Robots retro animados en pixel art',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'sprouts',
      name: 'Sprouts',
      description: 'Personajes botánicos animados',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'voxel-art',
      name: 'Voxel Art',
      description: 'Personajes tridimensionales animados',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'voxel-bot',
      name: 'Voxel Bot',
      description: 'Robots voxel tridimensionales animados',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'constellation',
      name: 'Constellation',
      description: 'Constelaciones estelares dinámicas',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'landscape',
      name: 'Landscape',
      description: 'Paisajes y cielos dinámicos en movimiento',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'planets',
      name: 'Planets',
      description: 'Planetas y órbitas espaciales animadas',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'gaze',
      name: 'Gaze',
      description: 'Expresiones y miradas en movimiento',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'moods',
      name: 'Moods',
      description: 'Caras y emociones animadas',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'blobs',
      name: 'Blobs',
      description: 'Formas fluidas orgánicas en movimiento',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'loops',
      name: 'Loops',
      description: 'Bucles cinéticos hipnóticos',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'shapes',
      name: 'Shapes',
      description: 'Formas geométricas animadas',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'squircles',
      name: 'Squircles',
      description: 'Figuras suaves en movimiento continuo',
      category: 'Animados',
      type: 'animated',
    },
    {
      id: 'waves',
      name: 'Waves',
      description: 'Ondas armónicas fluidas en movimiento',
      category: 'Animados',
      type: 'animated',
    },
  ];

  readonly avatarStyles: AvatarStyle[] = [
    ...this.staticStyles,
    ...this.animatedStyles,
  ];

  activeStyle = 'avataaars';
  tabType: 'all' | 'static' | 'animated' = 'all';
  searchAvatar = '';
  failedAvatars = new Set<string>();

  isDraggingStyles = false;
  private isMouseDownOnStyles = false;
  private startXStyles = 0;
  private scrollLeftStyles = 0;
  private hasDraggedStyles = false;

  mostrarSelectorAvatar = false;
  guardandoAvatar = false;
  showModal = false;
  loading!: boolean;
  userInfo: any;
  infoCliente: infoCliente | null = null;
  passwordEliminar = '';
  mostrarPasswordEliminar = false;
  errorEliminar = '';
  useremail: any;

  constructor(
    private observableService: ObservableService,
    private user: UserService,
    private clientS: ClientService,
    private loginS: LoginS,
    protected http: HttpService,
    protected router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    this.observableService.cliente$.subscribe(info => {
      if (!info) return;

      this.clienteAv = {
        nombre: info.nombre || '',
        cliente: String(
          info.cliente || this.user.obtenerServicioActivo() || ''
        ),
        avatarUrl: info.avatarUrl || null
      };
    });
    this.loadClientData(this.user.obtenerServicioActivo() ?? '');
  }

  protected async loadClientData(numeroCliente: string): Promise<void> {
    if (!numeroCliente?.trim()) {
      console.warn('No hay un número de cliente para consultar.');
      return;
    }
    try {
      const res = await firstValueFrom(this.clientS.getClientePorNumero(numeroCliente));
      this.infoCliente = res?.cliente ?? null;
      this.useremail = await firstValueFrom(this.clientS.getAuthenticatedUser());
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al cargar los datos');
    }
  }

  get selectedStyle(): AvatarStyle | undefined {
    return this.avatarStyles.find((style) => style.id === this.activeStyle);
  }

  get filteredStyles(): AvatarStyle[] {
    let base = this.avatarStyles;
    if (this.tabType === 'static') {
      base = this.staticStyles;
    } else if (this.tabType === 'animated') {
      base = this.animatedStyles;
    }

    const query = this.searchAvatar.trim().toLowerCase();
    if (!query) return base;

    return base.filter(
      (style) =>
        style.name.toLowerCase().includes(query) ||
        style.id.toLowerCase().includes(query) ||
        style.category.toLowerCase().includes(query) ||
        style.description.toLowerCase().includes(query)
    );
  }

  get visibleSeeds(): string[] {
    const query = this.searchAvatar.trim().toLowerCase();
    if (!query) return this.avatarSeeds;

    const matchingSeeds = this.avatarSeeds.filter((seed) =>
      seed.toLowerCase().includes(query)
    );

    return matchingSeeds.length > 0 ? matchingSeeds : this.avatarSeeds;
  }

  getAvatarUrl(styleId: string, seed: string): string {
    const isAnimated = this.animatedStyles.some((s) => s.id === styleId);
    if (isAnimated) {
      return `https://api.dicebear.com/10.x/${styleId}/svg?seed=${encodeURIComponent(
        seed
      )}&animationVariant=fast`;
    }
    return `https://api.dicebear.com/9.x/${styleId}/svg?seed=${encodeURIComponent(
      seed
    )}`;
  }

  setTabType(tab: 'all' | 'static' | 'animated'): void {
    this.tabType = tab;
    if (tab === 'static' && this.selectedStyle?.type === 'animated') {
      this.activeStyle = 'avataaars';
      this.failedAvatars.clear();
    } else if (tab === 'animated' && this.selectedStyle?.type !== 'animated') {
      this.activeStyle = 'clay';
      this.failedAvatars.clear();
    }
  }

  selectStyle(styleId: string): void {
    if (this.hasDraggedStyles) return;
    this.activeStyle = styleId;
    this.failedAvatars.clear();
  }

  onAvatarImageError(avatarUrl: string): void {
    this.failedAvatars.add(avatarUrl);
  }

  hasFailedAvatar(avatarUrl: string): boolean {
    return this.failedAvatars.has(avatarUrl);
  }

  scrollStyles(direction: 'left' | 'right'): void {
    const nav = this.stylesNavRef?.nativeElement;
    if (!nav) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    nav.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  onStylesMouseDown(event: MouseEvent): void {
    const nav = this.stylesNavRef?.nativeElement;
    if (!nav) return;
    this.isMouseDownOnStyles = true;
    this.hasDraggedStyles = false;
    this.startXStyles = event.pageX - nav.offsetLeft;
    this.scrollLeftStyles = nav.scrollLeft;
  }

  onStylesMouseMove(event: MouseEvent): void {
    const nav = this.stylesNavRef?.nativeElement;
    if (!this.isMouseDownOnStyles || !nav) return;
    const x = event.pageX - nav.offsetLeft;
    const walk = x - this.startXStyles;
    if (Math.abs(walk) > 4) {
      if (!this.hasDraggedStyles) {
        this.hasDraggedStyles = true;
        this.isDraggingStyles = true;
      }
      nav.scrollLeft = this.scrollLeftStyles - walk;
    }
  }

  onStylesMouseUp(): void {
    this.isMouseDownOnStyles = false;
    setTimeout(() => {
      this.hasDraggedStyles = false;
      this.isDraggingStyles = false;
    }, 50);
  }

  onStylesMouseLeave(): void {
    if (this.isMouseDownOnStyles) {
      this.isMouseDownOnStyles = false;
      setTimeout(() => {
        this.hasDraggedStyles = false;
        this.isDraggingStyles = false;
      }, 50);
    }
  }

  onStylesWheel(event: WheelEvent): void {
    const nav = this.stylesNavRef?.nativeElement;
    if (nav && Math.abs(event.deltaX) === 0 && Math.abs(event.deltaY) > 0) {
      event.preventDefault();
      nav.scrollLeft += event.deltaY;
    }
  }

  toggleSelectorAvatar(): void {
    if (this.guardandoAvatar) return;
    this.mostrarSelectorAvatar = !this.mostrarSelectorAvatar;
    if (this.mostrarSelectorAvatar && this.clienteAv.avatarUrl) {
      const match = this.clienteAv.avatarUrl.match(/dicebear\.com\/[^/]+\/([^/]+)\/svg/);
      if (match?.[1] && this.avatarStyles.some((s) => s.id === match[1])) {
        this.activeStyle = match[1];
      }
    }
  }

  async cambiarAvatar(url: string): Promise<void> {
    if (this.guardandoAvatar) return;

    if (this.clienteAv.avatarUrl === url) {
      this.mostrarSelectorAvatar = false;
      return;
    }

    this.guardandoAvatar = true;

    try {
      await firstValueFrom(this.clientS.updateAvatar({ avatar_url: url }));
      this.observableService.actualizarAvatar(url);
      this.clienteAv = { ...this.clienteAv, avatarUrl: url };
      this.mostrarSelectorAvatar = false;
    } catch (error) {
      this.http.errorHttp(error as HttpErrorResponse, 'Error al actualizar el avatar');
    } finally {
      this.guardandoAvatar = false;
    }
  }

  copiarAlPortapapeles(texto: string): void {
    if (!texto) return;

    navigator.clipboard.writeText(texto)
      .then(() => {
        toast.success('Copiado al portapapeles');
      })
      .catch(() => {
        toast.error('No se pudo copiar');
      });
  }

  abrirConfirmacionRegistro(): void {
    this.passwordEliminar = '';
    this.errorEliminar = '';
    this.mostrarPasswordEliminar = false;
    this.showModal = true;
  }

  cerrarModal(): void {
    if (this.loading) return;

    this.showModal = false;
    this.passwordEliminar = '';
    this.errorEliminar = '';
    this.mostrarPasswordEliminar = false;
  }

  async confirmarEliminarCuenta(): Promise<void> {
    this.errorEliminar = '';
    if (!this.passwordEliminar.trim()) {
      this.errorEliminar = 'Ingresa tu contraseña para continuar.';
      return;
    }
    this.loading = true;

    try {
      const respuesta = await firstValueFrom(
        this.loginS.deleteAccount(this.passwordEliminar)
      );
      toast.success(respuesta.message || 'Cuenta eliminada correctamente.');
      this.showModal = false;
      this.passwordEliminar = '';
      await firstValueFrom(this.loginS.logout());
      this.loginS.clearToken();
      await this.router.navigate(['/iniciar-sesion']);
    } catch (error) {
      this.http.errorHttp(
        error as HttpErrorResponse,
        'No se pudo eliminar la cuenta'
      );
    } finally {
      this.loading = false;
    }
  }
}
