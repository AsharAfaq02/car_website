import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private streamURL = 'http://10.0.0.38:8081'
  constructor(private http: HttpClient){}

  getSuggestions(year : any, make : any, model : any, part: any): Observable<any>{
    return this.http.get<any>(`${this.streamURL}/suggestions?year=${year}&make=${make}&model=${model}&part=${part}`, { responseType: 'text' as 'json' });
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