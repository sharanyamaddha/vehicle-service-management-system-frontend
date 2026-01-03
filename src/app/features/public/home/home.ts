import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {

  year = new Date().getFullYear();

  constructor(private router: Router) {}

  goLogin() {
    this.router.navigate(['/login']);
  }

  goRegister() {
    this.router.navigate(['/register']);
  }
}
