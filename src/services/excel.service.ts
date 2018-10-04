import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable()
export class ExcelService {

  constructor() { }

  public exportAsExcelFile(services: any[], tyres: any[], excelFileName: string): void {
    const serviceSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(services);
    const tyreSheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(tyres);
    const workbook: XLSX.WorkBook = { Sheets: { 'Service Prices': serviceSheet, 'Tyre Prices': tyreSheet }, SheetNames: ['Service Prices', 'Tyre Prices'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }

}