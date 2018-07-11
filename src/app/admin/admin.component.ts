import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from "@angular/router";

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  data: any = {
    title: 'Admin',
    activeTab: 'Manage Partner',
    activeDealInputTab: 'Tyres',
    partner: {},
    dealInputTyres: {},
    dealInputInclusions: {},
    partnerList: {},
    tyreList: [],
    inclusionList: [],
  };
  userInfo: any = {};

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/user', httpOptions).subscribe(data => {
      this.userInfo = data;
      this.data.title = this.userInfo.role === 'admin' ? 'Admin' : 'PartnerZone';
    }, err => {
      console.log(err);
    });
    this.getPartners();
  }

  setActiveTab = (tab:string, value: string) => {
    this.data[tab] = value;
  }

  partnerUpdate = () => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.post('/api/partner', this.data.partner, httpOptions).subscribe(resp => {
      console.log('success');
      this.getPartners();
      this.data.partner = {};
    }, err => {
      console.log(err.error.msg);
    });
  }

  getPartners = () => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/partner', httpOptions).subscribe(data => {
      console.log(data)
      this.data.partnerList = data;
    }, err => {
      console.log(err)
    });
  }

}
