import { Component } from '@angular/core';

@Component({
  selector: 'app-speed-test',
  imports: [],
  templateUrl: './speed-test.html',
  styleUrl: './speed-test.css'
})
export class SpeedTest {

  recommendationsOpen = false;

toggleRecommendations(): void {
    this.recommendationsOpen = !this.recommendationsOpen;
}

}
