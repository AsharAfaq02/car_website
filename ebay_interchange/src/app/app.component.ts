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
  data: any;
  carModel:any;
  base_model:any;
  queryStr:any;
  constructor(private fb: FormBuilder, private dataService: DataService){
  }
  ngOnInit(){
    this.form_search = this.fb.group({
      year: ['', Validators.required],
      make: ['',  Validators.required],
      model: ['',  Validators.required],
      part: ['',  Validators.required]
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
   this.queryStr = this.form_search.value.year+' '+this.form_search.value.make+' '+this.form_search.value.model+' '+this.form_search.value.part;
   this.form_validator = false;
   this.submitted_validator = true;
  this.data = '';
  this.carModel = '';
   this.dataService.postData(this.year, this.make, this.model, this.part)
   
   .subscribe(

    (response: string) => {
    console.log(response)
      
      this.carModel = Object.keys(JSON.parse(response));
      this.data = JSON.parse(response);
      
    },
    (error) =>
      console.error("error fetching data", error)
  )
   this.form_search.reset()
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