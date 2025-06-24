import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; 
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DialogModule], 
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminHomeComponent {
  showRegisteredDialog = false;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private router:Router,
  ){}
  
  ngOnInit(): void {

        this.route.queryParams.subscribe(params => {
          if (params['registrado'] === 'true') {
            this.showRegisteredDialog = true;

            this.location.replaceState(this.router.url.split('?')[0]);
          }
        });
      }
}