import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class PasswordService {
  matchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;

    // Si ambos están vacíos, no hay error
    if (!pass && !confirm) return null;

    // Si no son exactamente iguales (cubre incompletos y los que no coinciden)
    return pass === confirm ? null : { passwordMissMatch: true };
  }

  calculateStrength(password: string): number {
    if (!password) {
      return 0;
    }
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/\d/.test(password)) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    return strength;
  }

  public feddback(passwordStrength: number): any {
    switch (passwordStrength) {
      case 1:
        return { class: 'strength-weak', text: 'Débil' }
      case 2:
        return { class: 'strength-medium', text: 'Moderada' }
      case 3:
        return { class: 'strength-good', text: 'Buena' }
      case 4:
        return { class: 'strength-strong', text: 'Fuerte' }
      default:
        return { class: 'strength-none', text: 'Muy débil' }
    }
  }
}
