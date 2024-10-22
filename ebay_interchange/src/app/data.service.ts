import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private dataUrl = 'assets/full_ebay_exchanges.json';  // Path to your JSON file
  private url = "http://localhost:8080";
  private streamURL = 'http://localhost:8081'
  constructor(private http: HttpClient){}

  getInfo(){
    return this.http.get(this.dataUrl);
  }

  getEbayStream(){
    return this.http.get<any>(this.streamURL);

  }

  postData(year : any, make : any, model : any, part: any): Observable<any>{
    return this.http.get<any>(`${this.url}/postData?year=${year}&make=${make}&model=${model}&part=${part}`, { responseType: 'text' as 'json' });
  }

  posteBay(year : any, make : any, model : any, part: any, suggestion: any): Observable<any>{

    return new Observable(observer => {

      const evtSource = new EventSource(`${this.streamURL}/posteBay?year=${year}&make=${make}&model=${model}&part=${part}&suggestion=${suggestion}`);
      

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
  getComparisons(){
    return this.http.get<any>(`${this.url}/postSims`);
  }
}