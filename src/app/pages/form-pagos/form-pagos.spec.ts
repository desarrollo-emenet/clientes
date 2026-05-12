import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPagos } from './form-pagos';

describe('FormPagos', () => {
  let component: FormPagos;
  let fixture: ComponentFixture<FormPagos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPagos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormPagos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
