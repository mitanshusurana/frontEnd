import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';



interface createCustomer {
  customerName: string;
  openingCashBalance: number;
  openingMetalBalance: number;
}

@Component({
  selector: 'app-sub-ledger',
  standalone: true,
  imports :[ FormsModule , CommonModule , ReactiveFormsModule,HttpClientModule],
  templateUrl: './sub-ledger.component.html',
  styleUrl: './sub-ledger.component.scss'
})
export class SubLedgerComponent  {
  ledgerForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.ledgerForm = this.fb.group({
      customerName: ['', Validators.required],
      openingCashBalance: [0], 
      openingMetalBalance: [0]
    });
  }

  onSubmit() {
    if (this.ledgerForm.valid) {
      const newLedger: createCustomer = this.ledgerForm.value;

      this.http.post('http://localhost:8080/api/Ledgers', newLedger) 
        .subscribe(
          response => {
            console.log('Ledger created successfully!', response);
            // Optionally reset the form or navigate to another view
            this.ledgerForm.reset(); 
          },
          error => {
            console.error('Error creating ledger:', error);
            // Handle the error appropriately, e.g., display an error message
          }
        );
    } else {
      // Handle form validation errors (e.g., display error messages)
    }
  }
}
