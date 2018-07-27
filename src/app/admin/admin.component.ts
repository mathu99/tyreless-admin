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
    tyre: {},
    inclusion: {},
    partnerList: [],
    tyreList: [],
    inclusionList: [],
  };
  properties: any = {
    createPartnerLoading: false,
    createTyresLoading: false,
    createInclusionsLoading: false,
    partnerSelected: false,
    tyreSelected: false,
    inclusionSelected: false,
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

  logout() {
    localStorage.removeItem('jwtToken');
    this.router.navigate(['login']);
  }

  setActiveTab = (tab:string, value: string) => {
    this.data[tab] = value;
  }

  setActiveRow = (row:any, type:string) => {
    this.data[type] = row.selected ? {} : JSON.parse(JSON.stringify(row));
    this.data[type + 'List'].map(e => e.selected = (e === row) ? !e.selected : false);
    this.properties[type + 'Selected'] = row.selected;
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
      this.data.partnerList = data;
    }, err => {
      // this.data.partnerList = JSON.parse('[{"_id":"5b466061932d6770183fdc15","customerCode":"be42bc92-30ec-4538-8997-5592c2a0fbba","retailerName":"Tiger Wheel & Tyre","registeredName":"-","province":"Gauteng","suburb":"Sandton","branchName":"Sandton City","branchPin":"test pin","partnerZoneEmail":"admin@twt.co.za","salesEmail":"sales@twt.co.za","status":"Active","__v":0},{"_id":"5b470694824e3e0014b762f1","customerCode":"99b1850d-c6ec-4068-ae77-fcfd66b37548","retailerName":"Supa Quick","registeredName":"ABC (Pty) Ltd","province":"Gauteng","suburb":"Sandton","branchName":"Wynberg","branchPin":"26.109636. 28.083778","partnerZoneEmail":"admin@supaquick.co.za","salesEmail":"sales@supaquick.co.za","status":"Active","__v":0}]');
      console.log(err)
    });
  }

  tyreUpdate = () => {
    this.properties.createTyresLoading = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.post('/api/tyre', this.data.tyre, httpOptions).subscribe(resp => {
      this.getTyres();
      this.data.tyre = {};
    }, err => {
      console.log(err.error.msg);
    }, () => {
      this.properties.createTyresLoading = false;
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
    tyre.deleting = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') }),
      body: tyre,
    };

    this.http.delete('/api/tyre', httpOptions).subscribe(resp => {
      this.getTyres();
    }, err => {
      tyre.delting = false;
      console.log(err);
    });
  }

  inclusionUpdate = () => {
    this.properties.createInclusionsLoading = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.post('/api/inclusion', this.data.inclusion, httpOptions).subscribe(resp => {
      this.getInclusions();
      this.data.inclusion = {};
    }, err => {
      console.log(err);
    }, ()=>{
      this.properties.createInclusionsLoading = false;
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
    inclusion.deleting = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') }),
      body: inclusion,
    };

    this.http.delete('/api/inclusion', httpOptions).subscribe(resp => {
      this.getInclusions();
    }, err => {
      inclusion.deleting = false;
      console.log(err);
    });
  }

}
