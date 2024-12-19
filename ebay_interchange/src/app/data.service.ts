import { Injectable} from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private streamURL = 'http://10.0.0.38:8081'
  constructor(private http: HttpClient){}



  AutoCompleteYear(year: any){}
  AutoCompleteMake(make: any){
    
    return this.http.get<string>(`${this.streamURL}/makeAPI?make=${make}`, {responseType: 'text' as 'json'});
  
}
  AutoCompleteModel(make: any, model: any){
    return this.http.get<string>(`${this.streamURL}/modelAPI?make=${make}&model=${model}`, {responseType: 'text' as 'json'});
  }


  AutoCompletePart(part: any): Observable<any>{
    
    return this.http.get<any>(`${this.streamURL}/partAPI?part=${part}`, {responseType: 'text' as 'json'});
    
  }

  geteBaySearch(year : any, make : any, model : any, part: any, suggestion: any): Observable<any>{
    return new Observable(observer => {
      const evtSource = new EventSource(`${this.streamURL}/ebaySearch?year=${year}&make=${make}&model=${model}&part=${part}&suggestion=${suggestion}`);
      evtSource.onmessage = function(event) {
        const dataEbay = JSON.parse(event.data);
        if(dataEbay){
        observer.next(dataEbay);
        }
        if(dataEbay['comparisonMessg'] == 'end of comparisons'){
          setTimeout(() =>{ 
            evtSource.close();
            observer.complete(); // 
          }, 2000)
        }
    };
  })
  }
}