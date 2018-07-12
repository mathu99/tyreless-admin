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
    partnerList: [],
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
    this.getTyres();
    this.getInclusions();
  }

  setActiveTab = (tab:string, value: string) => {
    this.data[tab] = value;
  }

  partnerUpdate = () => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.post('/api/partner', this.data.partner, httpOptions).subscribe(resp => {
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

  tyreUpdate = () => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.post('/api/tyre', this.data.dealInputTyres, httpOptions).subscribe(resp => {
      this.getTyres();
      this.data.dealInputTyres = {};
    }, err => {
      console.log(err.error.msg);
    });
  }

  getTyres = () => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/tyre', httpOptions).subscribe(data => {
      this.data.tyreList = data;
    }, err => {
      console.log(err)
    });
  }

  removeTyre = (tyre: any) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') }),
      body: tyre,
    };

    this.http.delete('/api/tyre', httpOptions).subscribe(resp => {
      this.getTyres();
    }, err => {
      console.log(err);
    });
  }

  inclusionUpdate = () => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.post('/api/inclusion', this.data.dealInputInclusions, httpOptions).subscribe(resp => {
      this.getInclusions();
      this.data.dealInputInclusions = {};
    }, err => {
      console.log(err);
    });
  }

  getInclusions = () => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/inclusion', httpOptions).subscribe(data => {
      this.data.inclusionList = data;
    }, err => {
      console.log(err);
    });
  }

  removeInclusion = (inclusion: any) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') }),
      body: inclusion,
    };

    this.http.delete('/api/inclusion', httpOptions).subscribe(resp => {
      this.getInclusions();
    }, err => {
      console.log(err);
    });
  }

}
