import { Component, OnInit } from '@angular/core';
import { DataService } from './data.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{

  form_search: FormGroup;
  form_validator: boolean;
  submitted_validator: boolean;
  year: string;
  make: string;
  model: string;
  part: string;
  title: any;
  suggestions: any;
  carModel:any;
  base_model:any;
  queryStr:any;
  err:any;
  suggest:any;
  ebayData: any;
  
  constructor(private fb: FormBuilder, private dataService: DataService){
    
  }
  ngOnInit(){
    this.form_search = this.fb.group({
      year: ['', Validators.required],
      make: ['',  Validators.required],
      model: ['',  Validators.required],
      part: ['',  Validators.required],
      suggest:[this.suggestions? Validators.required:null]
      

      })
  }
  
  

  searchCarSubmit(){
    
    // Access each element of the array

       // Reset flag after submission
     
 if (this.form_search.valid) { 
   this.year =  this.form_search.value.year;
   this.make = this.form_search.value.make;
   this.model = this.form_search.value.model;
   this.part = this.form_search.value.part;
   this.suggest = this.form_search.value.suggest;
   this.queryStr = this.form_search.value.year+' '+this.form_search.value.make+' '+this.form_search.value.model+' '+this.form_search.value.part;
   this.form_validator = false;
   this.submitted_validator = true;  
   if(!this.suggestions){
   this.dataService.postData(this.year, this.make, this.model, this.part)
   .subscribe(

    (response: any) => {
      
      response = JSON.parse(response)['suggestions'];
      console.log(JSON.stringify(response));
      this.suggestions = response;
    },
    (error) =>
      console.error("error fetching data", error)
  )
}
else{
  if (this.form_search.valid) { 
  this.dataService.posteBay(this.year, this.make, this.model, this.part, this.suggest)
  .subscribe(

    (response: string) => {
     if(JSON.parse(response)['key'] == 'nodata'){
      this.err = 'This request could not be completed, check for errors, and try again.'
     }
     else{
      
      const modelCollection: { [key: string]: any[] } = {};

      // Process each listing
      JSON.parse(response).listings.forEach((listing: any) => {
        listing.model.forEach((item: any) => {
          const modelName = item.model;
          if (!modelCollection[modelName]) {
            modelCollection[modelName] = [];
          }
          modelCollection[modelName].push(item);
        });
      });
  
            this.carModel = modelCollection;
            this.ebayData =  Object.keys(modelCollection);
    }
        },
        (error) =>
          console.error("error fetching data", error)
      )
       this.form_search.reset()
    }  
  }
}
   
 else{
   this.form_validator = true;
   this.submitted_validator = false;
}


  }

invalidForm(){
  return this.form_validator;
}
submitted(){
  return this.submitted_validator;
}
}