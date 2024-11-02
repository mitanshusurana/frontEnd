
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService, CreateCustomer } from '../../services/api.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-sub-ledger',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule,HttpClientModule],
  providers: [ApiService],
  templateUrl: './sub-ledger.component.html',
  styleUrl: './sub-ledger.component.scss'
})
export class SubLedgerComponent {
  ledgerForm: FormGroup;

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.ledgerForm = this.fb.group({
      customerName: ['', Validators.required],
      openingCashBalance: [0], 
      openingMetalBalance: [0]
    });
  }

  onSubmit() {
    if (this.ledgerForm.valid) {
      const newLedger: CreateCustomer = this.ledgerForm.value;

      this.apiService.createLedger(newLedger)
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
