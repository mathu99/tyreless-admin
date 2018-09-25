import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from "@angular/router";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { error } from 'util';
import { ToastrService } from 'ngx-toastr';
import {
  MultiselectDropdownModule,
  IMultiSelectSettings,
  IMultiSelectTexts,
  IMultiSelectOption
} from 'angular-2-dropdown-multiselect';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Buffer } from 'buffer';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  data: any = {
    title: 'PartnerZone', //Admin
    activeTab: 'My Deals',  //Manage Partne
    activeDealInputTab: 'Tyres & Inclusions',
    partner: {},
    tyre: {},
    inclusion: {},
    partnerList: [],
    tyreList: [],
    inclusionList: [],
    history: [],
    pzPartner: {},
  };
  properties: any = {
    loadingPartners: true, /* Service call to retrieve */
    loadingTyres: true, 
    loadingInclusions: true, 
    loadingPendingPartnerServices: true,
    createPartnerLoading: false, /* Service call to create */
    createTyresLoading: false,
    createInclusionsLoading: false,
    signupPartnerLoading: true,
    partnerSelected: false, /* Is row selected for modification */
    tyreSelected: false,
    inclusionSelected: false,
    errorMessage: '', /* Msg that pops up in modal */
    surpressErrors: false,
    loadingHistory: true,
    pz: {
      changesMade: false,
      loadingTyres: true,
      loadingServices: true,
      updatingService: false,
      submittingChanges: false,
      updatingTyres: false,
      passwordUpdateError: '',
    },
    historyItem: {},
  };
  config: any = {
    logoList: [{
      name: 'Best Drive',
      value: 'Best Drive.jpg',
    }, {
      name: 'Dunlop Zone',
      value: 'Dunlop Zone.jpg',
    },{
      name: 'Hi-Q',
      value: 'Hi-Q.jpg',
    }, {
      name: 'Speedy',
      value: 'Speedy.jpg',
    },{
      name: 'Supaquick',
      value: 'Supaquick.jpg',
    }, {
      name: 'Tiger Wheel & Tyre',
      value: 'Tiger Wheel & Tyre.jpg',
    },{
      name: 'Tyremart',
      value: 'Tyremart.jpg',
    }, {
      name: 'Tyres & More',
      value: 'Tyres & More.jpg',
    }],
    tyreOptionList: [{
      name: 'Run Flat',
      value: 'Run Flat',
    },{
      name: 'Regular',
      value: 'Regular',
    }]
  };
  userInfo: any = {};

  // Settings configuration
  dropdownSettings: IMultiSelectSettings = {
    enableSearch: false,
    showCheckAll: false,
    showUncheckAll: false,
    checkedStyle: 'fontawesome',
    buttonClasses: 'btn btn-secondary partner-dropdown',
    dynamicTitleMaxItems: 1,
    displayAllSelectedText: true,
  };

  // Text configuration
  inclusionTexts: IMultiSelectTexts = {
    allSelected: 'All Inclusions',
    defaultTitle: 'None',
  };

  inclusionOptions: IMultiSelectOption[];
  
  @ViewChild('errorModal') private errorModal;
  @ViewChild('tyreSelectionModal') private tyreSelectionModal;
  @ViewChild('partnerCreationModal') private partnerCreationModal;
  @ViewChild('historyDetailModal') private historyDetailModal;

  constructor(private http: HttpClient, private router: Router, private modalService: NgbModal, private toastr: ToastrService) { }

  ngOnInit() {
    if (!localStorage.getItem('jwtToken')) {
      this.router.navigate(['login']);
      return;
    }
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/user', httpOptions).subscribe(data => {
      this.userInfo = data;
      this.data.title = this.userInfo.role === 'admin' ? 'Admin' : 'PartnerZone';
      this.data.activeTab = this.userInfo.role === 'admin' ? 'Manage Partner' : 'My Deals';
      if (this.userInfo.role !== 'admin') {
        this.data.pzPartner.userInfo = this.userInfo;
        this.getPartnerTyres(this.userInfo['_id']);
        this.getPartnerServices(this.userInfo['_id']);
      } else {
        this.getPendingPartnerServices();
      }
      this.getTyres(this.userInfo.role !== 'admin');
      this.getHistory();
      this.data.activeDealInputTab = this.userInfo.role === 'admin' ? 'Tyres' : 'Tyres & Inclusions';
    }, err => {
      this.properties.errorMessage = this.extractError(err);
    });
    this.getPartners();
    this.getInclusions();
  }

  onSelectFile(event, tyre) { // called each time file input changes
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]); // read file as data url
      reader.onload = (event) => { // called once readAsDataURL is completed
        this.data.tyre.url = event.target['result'];
      }
    }
}

  extractError = (err: any):void => {
    let errorMessage = '';
    if (err.error && err.error.msg) {
      errorMessage += err.error.msg;
    } else if (err.message) {
      errorMessage += err.message;
    } else {
      errorMessage = 'Unknown error';
    }
    if (!this.properties.surpressErrors)  {
      this.toastr.warning(errorMessage, 'An error occured');
    }
  }

  checkPasswordValidity = () => {
    this.properties.pz.passwordUpdateError = '';
    if (!this.data.pzPartner.newPasswordConfirm || this.data.pzPartner.newPasswordConfirm !== this.data.pzPartner.newPassword) {
      this.properties.pz.passwordUpdateError = 'Passwords must match';
    }
    if (!this.data.pzPartner.newPassword || this.data.pzPartner.newPassword.length < 8) {
      this.properties.pz.passwordUpdateError = 'Password must be at least 8 characters';
    }
  }

  updatePartnerPassword = (): void => {
    this.properties.pz.updatingPassword = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    let request = {
      newPassword: this.data.pzPartner.newPassword,
      username: this.userInfo.username,
      role: this.userInfo.role,
    }
    this.http.post('/api/changePassword', request, httpOptions).subscribe(resp => {
      this.data.pzPartner.newPassword = '';
      this.data.pzPartner.newPasswordConfirm = '';
      this.properties.pz.passwordUpdateError = '';
      this.toastr.success('Your password has successfully been updated', 'Password updated');
      this.addToHistory('Password updated', JSON.stringify({'Action':'Password updated'}));
      this.properties.pz.updatingPassword = false;
      localStorage.setItem('jwtToken', resp['token']);  /* Get updated token */
    }, err => {
      this.properties.createPartnerLoading = false;
      this.properties.errorMessage = this.extractError(err);
    });
  }

  openPartnerCreationModal = ():void => {
    this.open(this.partnerCreationModal);
  }

  openTyreSelectionModal = ():void => {
    this.open(this.tyreSelectionModal, { size: 'lg' });
  }

  openErrorModal = ():void => {
    this.open(this.errorModal);
  }

  open(content, options?:any) {
    this.modalService.open(content, options).result.then((result) => {}, (reason) => {});
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

  partnerUpdate = (type?:string) => {
    this.properties.createPartnerLoading = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.post('/api/partner', this.data.partner, httpOptions).subscribe(resp => {
      this.getPartners();
      if (!this.properties.partnerSelected && type !== 'status') { /* In case of new partner - register them on site too */
        let randomPassword = Math.random().toString(36).slice(-8); /* Generate random password string */
        let signupData = {
          username: this.data.partner.partnerZoneEmail,
          password: randomPassword,
          role: 'partner',
        }
        this.openPartnerCreationModal();
        this.properties.signupPartnerLoading = true;
        this.properties.signupUser = signupData.username;
        this.properties.signupPass = signupData.password;
        this.http.post('/api/signup', signupData).subscribe(resp => {
          this.data.partner = {};
          this.properties.partnerSelected = false;
          this.properties.signupPartnerLoading = false;
        }, err => {
          this.properties.signupPartnerLoading = false;
          this.properties.errorMessage = this.extractError(err);
        });
      }else {
        if (type === 'status') {
          this.addToHistory(
            _.get(this.data, 'partner.partnerZoneEmail') + ' is now ' + _.get(this.data, 'partner.status'), 
            JSON.stringify({'partner': _.get(this.data, 'partner.partnerZoneEmail'), 'status': _.get(this.data, 'partner.status') }));
        }
        this.data.partner = {};
        this.properties.partnerSelected = false;
      }
      this.properties.createPartnerLoading = false;
    }, err => {
      this.properties.createPartnerLoading = false;
      this.properties.errorMessage = this.extractError(err);
    });
  }

  updateStatus = (partner: any, $event: any, status: string) => {
    $event.stopPropagation();
    this.data.partner = JSON.parse(JSON.stringify(partner));
    this.data.partner.status = status;
    this.partnerUpdate('status');
  }

  getPartnerServices = (id:string) => {
    this.data.pzPartner.services = {};
    this.properties.pz.loadingServices = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/partnerServices?userRef=' + id, httpOptions).subscribe(data => {
      if (!data['noResults']) {
        this.data.pzPartner.services = data;
      }
      this.properties.pz.loadingServices = false;
    }, err => {
      this.properties.pz.loadingServices = false;
      this.properties.errorMessage = this.extractError(err);
    });
  }

  updatePartnerServices = () => {
    this.properties.pz.updatingService = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.post('/api/partnerServices', this.data.pzPartner, httpOptions).subscribe(resp => {
      let auditPayload = {
        'Live Wheel Alignment Price': _.get(this.data, 'pzPartner.services.liveWheelAlignmentPrice', ''),
        'Live Wheel Balancing Price': _.get(this.data, 'pzPartner.services.liveWheelBalancingPrice', ''),
        'New Wheel Alignment Price': _.get(this.data, 'pzPartner.services.wheelAlignmentPrice', ''),
        'New Wheel Balancing Price': _.get(this.data, 'pzPartner.services.wheelBalancingPrice', ''),
    };
      this.addToHistory('Service prices submitted for approval', JSON.stringify(auditPayload));
      this.getPartnerServices(this.data.pzPartner.userInfo._id);
      this.properties.pz.updatingService = false;
      this.toastr.success('Prices have been submitted for approval', 'Prices submitted');
    }, err => {
      this.properties.pz.updatingService = false;
      this.properties.errorMessage = this.extractError(err);
    });
  }

  getPartners = () => {
    this.data.partnerList = [];
    this.properties.loadingPartners = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/partner', httpOptions).subscribe(data => {
      this.data.partnerList = data;
      if (this.userInfo.role !== 'admin') { /* Get the logged in partners full details */
        this.data.partnerDetails = this.data.partnerList.filter(p => {
          return p.partnerZoneEmail === this.userInfo.username;
        })[0];
      }
      this.properties.loadingPartners = false;
    }, err => {
      this.properties.loadingPartners = false;
      this.properties.errorMessage = this.extractError(err);
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
      this.addToHistory(partner.partnerZoneEmail + ' deleted', JSON.stringify({'Action': partner.partnerZoneEmail + ' deleted'}));
      this.getPartners();
    }, err => {
      partner.deleting = false;
      this.properties.errorMessage = this.extractError(err);
    });
  }

  tyreUpdate = () => {
    this.properties.createTyresLoading = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.data.tyre.binData = new Buffer(this.data.tyre.url.split(',')[1],'base64');
    this.data.tyre.contentType = this.data.tyre.url.split('data:')[1].split(';base64')[0];
    let req = JSON.parse(JSON.stringify(this.data.tyre));
    req['url'] = null;
    this.http.post('/api/tyre', req, httpOptions).subscribe(resp => {
      this.getTyres();
      this.data.tyre = {};
      this.properties.createTyresLoading = false;
    }, err => {
      this.properties.createTyresLoading = false;
      this.properties.errorMessage = this.extractError(err);
    });
  }

  getTyres = (hidePartnerTyres?:boolean) => {
    this.data.tyreList = [];
    this.properties.loadingTyres = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/tyre', httpOptions).subscribe(data => {
      this.properties.loadingTyres = false;
      if (hidePartnerTyres) {
        this.http.get('/api/partnerTyre?userRef=' + this.data.pzPartner.userInfo._id, httpOptions).subscribe(resp => {
          let newData = data as any[];
          let newResp = resp as any[];
          this.data.tyreList = newData.filter(e => newResp.filter(r => r.tyreRef._id == e._id).length === 0)
        }, err => {
            this.properties.errorMessage = this.extractError(err);
        })
      } else {
        this.data.tyreList = data;
        this.data.tyreList = this.data.tyreList.map(t => {
            t.url = 'data:' + t.tyreImage.contentType + ';base64,' + new Buffer(t.tyreImage.data.data).toString('base64');
            return t;
        })
      }
    }, err => {
      this.properties.loadingTyres = false;
      this.properties.errorMessage = this.extractError(err);
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
      this.properties.errorMessage = this.extractError(err);
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
      this.properties.createInclusionsLoading = false;
    }, err => {
      this.properties.createInclusionsLoading = false;
      this.properties.errorMessage = this.extractError(err);
    });
  }

  getInclusions = () => {
    this.data.inclusionList = [];
    this.properties.loadingInclusions = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/inclusion', httpOptions).subscribe(data => {
      this.properties.loadingInclusions = false;
      this.data.inclusionList = data;
      this.inclusionOptions = this.data.inclusionList.map((e, i) => {
        return {
          id: i,
          name: e.description
        };
      });
    }, err => {
      this.properties.loadingInclusions = false;
      this.properties.errorMessage = this.extractError(err);
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
      this.properties.errorMessage = this.extractError(err);
    });
  }

  getPartnerTyres = (userRef: String) => {
    this.properties.pz.loadingTyres = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/partnerTyre?userRef=' + userRef, httpOptions).subscribe(data => {
      this.properties.pz.loadingTyres = false;
      this.data.pzPartner.tyreList = data;
      // this.data.pzPartner.tyreList.forEach(e => {
      //   e.inclusionIndex = e.inclusion.map(inc => {
      //     let item = this.data.inclusionList.filter(i => i.description === inc)[0];
      //     return this.data.inclusionList.indexOf(item);
      //   })
      // });
    }, err => {
      this.properties.pz.loadingTyres = false;
      this.properties.errorMessage = this.extractError(err);
    });
  }

  addTyreToPartner = (tyre:any) => {
    let partnerTyre = {
      userRef: this.userInfo._id,
      tyreRef: tyre._id,
    }
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.post('/api/partnerTyre', partnerTyre, httpOptions).subscribe(resp => {
      this.toastr.success('Don\'t forget to configure tyre price and inclusions', 'Tyre Added', {timeOut:5000});
      this.getPartnerTyres(this.userInfo._id);
      this.getTyres(true);
    }, err => {
      this.properties.errorMessage = this.extractError(err);
    });
  }

  removePartnerTyre = (tyre:any) => {
    tyre.deleting = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') }),
      body: tyre,
    };
    this.http.delete('/api/partnerTyre', httpOptions).subscribe(resp => {
      this.data.pzPartner.tyreList = [];
      this.getTyres(true);
      this.getPartnerTyres(this.data.pzPartner.userInfo._id);
    }, err => {
      tyre.deleting = false;
      this.properties.errorMessage = this.extractError(err);
    });
  }

  updateChangesMade = (changesMade:boolean, tyre:any) => {
    this.properties.pz.changesMade = changesMade;
    this.properties.pz.updatingTyres = true;
    tyre.inclusion = tyre.inclusionIndex.map(e => this.inclusionOptions[e].name);
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.post('/api/partnerTyre', tyre, httpOptions).subscribe(resp => {
      this.properties.pz.updatingTyres = false;
    }, err => {
      this.properties.errorMessage = this.extractError(err);
      this.properties.pz.updatingTyres = false;
    });
  }

  submitPartnerChanges = () => {
    this.properties.pz.submittingChanges = true;
  }

  getPendingPartnerServices = () => {
    this.properties.loadingPendingPartnerServices = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.data.pendingItems = [];
    this.http.get('/api/pendingPartnerServices', httpOptions).subscribe(data => {
      /* TODO - get pending partner tyres */
      let arr:any = data;
      arr.forEach(e => {
        let item = {
          user: e.userRef,
          services:{
            wheelAlignmentPrice: e.wheelAlignmentPrice,
            wheelBalancingPrice: e.wheelBalancingPrice,
          }
        }
        this.getPartnerByEmail(e.userRef.username, e);
      });
      this.properties.loadingPendingPartnerServices = false;
    }, err => {
      this.properties.loadingPendingPartnerServices = false;
      this.properties.errorMessage = this.extractError(err);
    });
  }

  getPartnerByEmail = (email:String, partner:Object) => {
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    this.http.get('/api/partnerByEmail?email=' + email, httpOptions).subscribe(data => {
      partner['userDetails'] = data;
      this.data.pendingItems.push(partner);
    }, err => {
      this.properties.errorMessage = this.extractError(err);
    });
  }

  approveAllChanges = (pendingItem: any) => {
    pendingItem.approving = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    let req = {
      services: {
        wheelAlignmentPrice: pendingItem.wheelAlignmentPrice,
        wheelBalancingPrice: pendingItem.wheelBalancingPrice,
      },
      userInfo: pendingItem.userRef,
    }
    this.http.post('/api/partnerServices?review=true', req, httpOptions).subscribe(resp => {
      pendingItem.approving = false;
      this.toastr.success('Prices have been approved', 'Prices approved');
      this.getPendingPartnerServices();
      this.addToHistory('Prices approved', JSON.stringify(req.services), pendingItem.userRef);
    }, err => {
      pendingItem.approving = false;
      this.properties.errorMessage = this.extractError(err);
    });
  }

  addToHistory = (description: String, payload: String, affectedId?: String) => {
    let auditItem = {
      description,
      payload,
      userRef: this.userInfo['_id'],
    }, httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    if (affectedId) {
      auditItem['affectedRef'] = affectedId;
    }
    this.http.post('/api/auditItem', auditItem, httpOptions).subscribe(resp => {
      this.getHistory();
    }, err => {
      this.properties.errorMessage = this.extractError(err);
    });
  }

  getHistory = () => {
    this.properties.loadingHistory = true;
    let httpOptions = {
      headers: new HttpHeaders({ 'Authorization': localStorage.getItem('jwtToken') })
    };
    let url = '/api/auditItem';
    url += (this.userInfo.role === 'admin') ? '' : '?userRef=' + this.userInfo['_id'];
    this.http.get(url, httpOptions).subscribe(resp => {
      this.properties.loadingHistory = false;
      if (resp['length'] > 0) {
        this.data.history = resp;
        this.data.history = this.data.history.map(e => {
          e.payload = JSON.parse(e.payload);
          e.date = moment(e.date).format('YYYY-MM-DD HH:mm:ss');
          return e;
        })
      }
    }, err => {
      this.properties.loadingHistory = false;
      this.properties.errorMessage = this.extractError(err);
    });
  }

  viewHistoryDetail = (historyItem:any) => {
    this.properties.historyItem = historyItem;
    this.open(this.historyDetailModal);
  }

}
