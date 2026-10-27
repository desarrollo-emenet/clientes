import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvisoPrivacidad } from './aviso-privacidad';

describe('AvisoPrivacidad', () => {
  let component: AvisoPrivacidad;
  let fixture: ComponentFixture<AvisoPrivacidad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvisoPrivacidad]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvisoPrivacidad);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
