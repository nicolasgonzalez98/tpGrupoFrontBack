import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; 
@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminHomeComponent {
 
}