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
  properties: any = { loggingIn: false };

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
  }

  login() {
    this.properties.loggingIn = true;
    this.http.post('/api/signin',this.data).subscribe(resp => {
      this.data = resp;
      localStorage.setItem('jwtToken', this.data.token);
      this.router.navigate(['admin']);
    }, err => {
      this.data.message = err.error.msg;
      this.properties.loggingIn = false;
    });
  }

}
