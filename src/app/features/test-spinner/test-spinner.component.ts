import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-test-spinner',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './test-spinner.component.html',
  styleUrls: ['./test-spinner.component.scss']
})
export class TestSpinnerComponent {
  showSpinner = true;
  isFullScreen = true;

  toggleFullScreen() {
    this.isFullScreen = !this.isFullScreen;
  }
}
