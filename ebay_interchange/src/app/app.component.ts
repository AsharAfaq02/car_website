import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core'; 
import { DataService } from './data.service'; 
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { Observable, of, Subscription } from 'rxjs'; 
import { ChangeDetectorRef } from '@angular/core'; 
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({ 
  selector: 'app-root', 
  templateUrl: './app.component.html', 
  styleUrls: ['./app.component.css'] ,
  changeDetection: ChangeDetectionStrategy.OnPush
  
}) 

export class AppComponent implements OnInit {

  
  searchControlMake = new FormControl();
  searchControlModel = new FormControl();
  searchControlPart = new FormControl();

  MakeSuggestions: string[] = [];
  ModelSuggestions: string[] = [];
  PartSuggestions: string[] = [];

  form_search: FormGroup;
  form_validator: boolean;
  submitted_validator: boolean;
  err: any;

  year: string;
  make: string;
  model: string;
  part: string;
  title: any;

  queryStr: any;
  suggest: any;
  ebayData_1: any[] = [];
  ebayData: any[] = [];

  comparisonData: any[] = [];
  alertComparison: any[] = [];

  private subscription: Subscription | null = null;
  constructor(private fb: FormBuilder, private dataService: DataService, private cdr: ChangeDetectorRef) {}
  ngOnInit() {

    this.form_search = this.fb.group({
      year: ['', Validators.required],
      make: this.searchControlMake,
      model: this.searchControlModel,
      part: this.searchControlPart
  });

    this.searchControlMake.valueChanges
    .pipe(
      debounceTime(100), // Wait for the user to stop typing
      distinctUntilChanged(), // Ignore if the value didn't change
      switchMap(query => this.fetchMakeSuggestions(query)) // Fetch suggestions from backend
    )
    .subscribe(
      (MakeSuggestions: string) => {

        this.MakeSuggestions = JSON.parse(MakeSuggestions.replace(/'/g, '"')); // Update the suggestions list
        this.cdr.detectChanges();
      },
      error => console.error('Error fetching make suggestions', error));
    



      this.searchControlModel.valueChanges
      .pipe(
        debounceTime(100), // Wait for the user to stop typing
        distinctUntilChanged(), // Ignore if the value didn't change
        switchMap(query => this.fetchModelSuggestions(query)) // Fetch suggestions from backend
      )
      .subscribe(
        (ModelSuggestions: string) => {
  
          this.ModelSuggestions = JSON.parse(ModelSuggestions.replace(/'/g, '"')); // Update the suggestions list
          this.cdr.detectChanges();
        },
        error => console.error('Error fetching make suggestions', error));
    

      this.searchControlPart.valueChanges
      .pipe(
        debounceTime(100), // Wait for the user to stop typing
        distinctUntilChanged(), // Ignore if the value didn't change
        switchMap(query => this.fetchPartSuggestions(query)) // Fetch suggestions from backend
      )
      .subscribe(
        (PartSuggestions: string) => {
  
          this.PartSuggestions = JSON.parse(PartSuggestions.replace(/'/g, '"')); // Update the suggestions list
          this.cdr.detectChanges();
        },
        error => console.error('Error fetching make suggestions', error));
  
  }

  fetchMakeSuggestions(query: string): Observable<string> {
    if(!query){
        return of("[]");
    }
    return this.dataService.AutoCompleteMake(query); // Backend call
  }

  fetchModelSuggestions(query: string): Observable<string> {
    if(!query && !this.MakeSuggestions){
        return of("[]");
    }
    return this.dataService.AutoCompleteModel(this.MakeSuggestions, query); // Backend call

      }

  fetchPartSuggestions(query: string): Observable<string> {
    if(!query && !this.MakeSuggestions && !this.ModelSuggestions){
        return of("[]");
      }
    return this.dataService.AutoCompletePart(query); // Backend call
  }


  async searchCarSubmit() {

      if (this.form_search.valid) {
          this.year = this.form_search.value.year;
          this.make = this.form_search.value.make;
          this.model = this.form_search.value.model;
          this.part = this.form_search.value.part;
          this.queryStr = this.form_search.value.year + ' ' + this.form_search.value.make + ' ' + this.form_search.value.model + ' ' + this.form_search.value.part;
          this.form_validator = false;
          this.submitted_validator = true;

      
          if (this.subscription) {
              this.subscription.unsubscribe();
            }
            this.subscription = this.dataService.geteBaySearch(this.form_search.value.year, this.form_search.value.make, this.form_search.value.model, this.form_search.value.part, this.form_search.value.suggest).subscribe(data => {

            if (data['message'] == 'end of stream') {
              this.ebayUpdated();
              return;

            } else if (data['title']) {
                this.ebayData_1.push(data)
                Object(data.info.itemSummaries).forEach((element: any) => {
                  this.ebayData.push({
                    title: element.title,
                    itemWebUrl: element.itemWebUrl,
                    imageUrl: element.image.imageUrl,
                    priceValue: element.price.value,
                    priceCurrency: element.price.currency
                  });

                })
                            
            this.ebayUpdated();
            return;

            } else if (data['comparison']) {
              Object(this.ebayData).forEach((element: any) => {
                if (data.comparison == element.title) {
                  element.comp = data.similiarity;
                  this.comparisonData.push(element)
                                      

                  }
                })

            } else if (data['comparisonMessg'] == 'end of comparisons') {
                let uniqueList = this.comparisonData.filter((obj, index, self) => index === self.findIndex((o) => o.title === obj.title && o.comp === obj.comp));
                uniqueList.sort((a, b) => b.comp - a.comp)
                this.alertComparison = uniqueList.slice(0, 10)
                this.comparisonUpdated()
                return;
              }
            }, (error) => console.error("error fetching data", error));
            this.form_search.reset();
            
      } else {
          this.form_validator = true;
          this.submitted_validator = false;
      }
    }
  ebayUpdated() {
      this.cdr.detectChanges(); 
      }

  comparisonUpdated() {
      this.cdr.detectChanges(); 
      this.cdr.detach();
  }
  onDivClick() {
      this.cdr.detectChanges(); 
  }
  invalidForm() {
      return this.form_validator;
  }
  submitted() {
      return this.submitted_validator;
  }

  refreshPage(){
    this.form_search.reset({
      year: null,
      make: '',
      model: '',
      part: ''
    });
    window.location.reload();
    
  }
}