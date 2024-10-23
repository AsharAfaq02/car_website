import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core'; 
import { DataService } from './data.service'; 
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { Subscription } from 'rxjs'; 
import { ChangeDetectorRef } from '@angular/core'; 

@Component({ 
  selector: 'app-root', 
  templateUrl: './app.component.html', 
  styleUrls: ['./app.component.css'] ,
  changeDetection: ChangeDetectionStrategy.OnPush
  
}) 

export class AppComponent implements OnInit {

  form_search: FormGroup;
  form_validator: boolean;
  submitted_validator: boolean;
  err: any;

  year: string;
  make: string;
  model: string;
  part: string;
  title: any;
  suggestions: any;

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
          make: ['', Validators.required],
          model: ['', Validators.required],
          part: ['', Validators.required],
          suggest: [this.suggestions ? Validators.required : null]
      });
  }
  async searchCarSubmit() {
      if (this.form_search.valid) {
          this.year = this.form_search.value.year;
          this.make = this.form_search.value.make;
          this.model = this.form_search.value.model;
          this.part = this.form_search.value.part;
          this.suggest = this.form_search.value.suggest;
          this.queryStr = this.form_search.value.year + ' ' + this.form_search.value.make + ' ' + this.form_search.value.model + ' ' + this.form_search.value.part;
          this.form_validator = false;
          this.submitted_validator = true;
          if (!this.suggestions) {
              this.dataService.postData(this.year, this.make, this.model, this.part).subscribe(
                  (response: any) => {
                      response = JSON.parse(response)['suggestions'];
                      this.suggestions = response;
                      this.cdr.detectChanges();
                  },
                  (error) => console.error("error fetching data", error));
          } else {
              if (this.form_search.valid) {
                  if (this.subscription) {
                      this.subscription.unsubscribe();
                  }
                  this.subscription = this.dataService.posteBay(this.form_search.value.year, this.form_search.value.make, this.form_search.value.model, this.form_search.value.part, this.form_search.value.suggest).subscribe(data => {
                          if (data['message'] == 'end of stream') {} else if (data['title']) {
                              this.ebayData_1.push(data)
                              Object(data.info.itemSummaries).forEach((element: any) => {
                                  this.ebayData.push({
                                      title: element.title,
                                      itemHref: element.itemHref,
                                      imageUrl: element.image.imageUrl,
                                      priceValue: element.price.value,
                                      priceCurrency: element.price.currency
                                  });
                              })
                              this.ebayUpdated();

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
                          }
                      },
                      (error) => console.error("error fetching data", error));
                  this.form_search.reset();
              }
          }
      } else {
          this.form_validator = true;
          this.submitted_validator = false;
      }
  }
  ebayUpdated() {
      this.cdr.detectChanges(); // Replace this with any function you want to perform 
  }
  comparisonUpdated() {
      this.cdr.detectChanges(); // Replace this with any function you want to perform 
      this.cdr.detach();
  }
  onDivClick() {
      this.cdr.detectChanges(); // Replace this with any function you want to perform 
  }
  invalidForm() {
      return this.form_validator;
  }
  submitted() {
      return this.submitted_validator;
  }
}