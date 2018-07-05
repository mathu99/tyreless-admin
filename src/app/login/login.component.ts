import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from "@angular/router";
import { Observable } from 'rxjs/Observable';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  data: any = { username:'', password:'', message: '' };

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
  }

  login() {
    this.http.post('/api/signin',this.data).subscribe(resp => {
      this.data = resp;
      localStorage.setItem('jwtToken', this.data.token);
      this.router.navigate(['books']);
      this.data.message = 'boom';
    }, err => {
      this.data.message = err.error.msg;
    });
  }

}
