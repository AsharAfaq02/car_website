import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { provideHttpClient, withFetch } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class DataService {

  private dataUrl = 'assets/full_ebay_exchanges.json';  // Path to your JSON file
  private url = "http://localhost:8080";
  constructor(private http: HttpClient){}

  getInfo(){
    return this.http.get(this.dataUrl);
  }

  postData(year : any, make : any, model : any, part: any): Observable<any>{
    return this.http.get<any>(`${this.url}/postData?year=${year}&make=${make}&model=${model}&part=${part}`, { responseType: 'text' as 'json' });
  }
}