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
    loadingPartners: true, /* Service call to retrieve */
    loadingTyres: true, 
    loadingInclusions: true, 
    createPartnerLoading: false, /* Service call to create */
    createTyresLoading: false,
    createInclusionsLoading: false,
    partnerSelected: false, /* Is row selected for modification */
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
    this.properties.createPartnerLoading = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.post('/api/partner', this.data.partner, httpOptions).subscribe(resp => {
      this.getPartners();
      this.data.partner = {};
      this.properties.partnerSelected = false;
      this.properties.createPartnerLoading = false;
    }, err => {
      this.properties.createPartnerLoading = false;
      console.log(err.error.msg);
    });
  }

  getPartners = () => {
    this.data.partnerList = {};
    this.properties.loadingPartners = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/partner', httpOptions).subscribe(data => {
      this.data.partnerList = data;
      this.properties.loadingPartners = false;
    }, err => {
      this.properties.loadingPartners = false;
      // this.data.partnerList = JSON.parse('[{"_id":"5b466061932d6770183fdc15","customerCode":"be42bc92-30ec-4538-8997-5592c2a0fbba","retailerName":"Tiger Wheel & Tyre","registeredName":"-","province":"Gauteng","suburb":"Sandton","branchName":"Sandton City","branchPin":"test pin","partnerZoneEmail":"admin@twt.co.za","salesEmail":"sales@twt.co.za","status":"Active","__v":0},{"_id":"5b470694824e3e0014b762f1","customerCode":"99b1850d-c6ec-4068-ae77-fcfd66b37548","retailerName":"Supa Quick","registeredName":"ABC (Pty) Ltd","province":"Gauteng","suburb":"Sandton","branchName":"Wynberg","branchPin":"26.109636. 28.083778","partnerZoneEmail":"admin@supaquick.co.za","salesEmail":"sales@supaquick.co.za","status":"Active","__v":0}]');
      console.log(err)
    });
  }

  removePartner = (partner: any, $event: any) => {
    $event.stopPropagation();
    partner.deleting = true;
    this.data.partner = {};
    partner.selected = false;
    this.properties.partnerSelected = false;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') }),
      body: partner,
    };

    this.http.delete('/api/partner', httpOptions).subscribe(resp => {
      this.getPartners();
    }, err => {
      partner.deleting = false;
      console.log(err);
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
    this.data.tyreList = {};
    this.properties.loadingTyres = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/tyre', httpOptions).subscribe(data => {
      this.properties.loadingTyres = false;
      this.data.tyreList = data;
    }, err => {
      this.properties.loadingTyres = false;
      console.log(err)
    });
  }

  removeTyre = (tyre: any, $event: any) => {
    $event.stopPropagation();
    tyre.deleting = true;
    this.data.tyre = {};
    tyre.selected = false;
    this.properties.tyreSelected = false;
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
    this.data.inclusionList = {};
    this.properties.loadingInclusions = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/inclusion', httpOptions).subscribe(data => {
      this.properties.loadingInclusions = false;
      this.data.inclusionList = data;
    }, err => {
      this.properties.loadingInclusions = false;
      console.log(err);
    });
  }

  removeInclusion = (inclusion: any, $event: any) => {
    $event.stopPropagation();
    inclusion.deleting = true;
    this.data.inclusion = {};
    inclusion.selected = false;
    this.properties.inclusionSelected = false;
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
