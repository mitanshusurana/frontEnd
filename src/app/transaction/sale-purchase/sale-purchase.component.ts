import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
@Component({
  selector: 'app-sale-purchase',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,NgSelectModule, HttpClientModule],
  templateUrl: './sale-purchase.component.html',
  styleUrls: ['./sale-purchase.component.scss']
})
export class SalePurchaseComponent implements OnInit {
  transactionForm: FormGroup;
  ledgerNames: string[] = ['99ba'];
  stockNames: string[] = ['bar', 'pcs', 'ft', 'kachha', 'maal'];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    const today = new Date().toISOString().split('T')[0];

    this.transactionForm = this.fb.group({
      date: [today, Validators.required],
      transaction: ['', Validators.required],
      ledgerName: ['', Validators.required],
      stockName: ['', Validators.required],
      netWeight: [0, [Validators.required, Validators.min(0)]],
      touch: [0, Validators.required],
      pure: [{ value: 0, disabled: true }],
      rate: [0],
      amount: [{ value: 0, disabled: true }],
      cash: [0],
      comments: ['']
    });
    
  }

  ngOnInit(): void {
    this.fetchLedgerNames();
    this.onChanges();
  }

  fetchLedgerNames(): void {
    this.http.get<string[]>('http://localhost:8080/api/Ledgers').subscribe(data => {
  
      this.ledgerNames = data;
    });
  }

  onChanges(): void {
    this.transactionForm.get('transaction')!.valueChanges.subscribe(transactionType => {
      this.toggleFields(transactionType);
    });

    this.transactionForm.get('netWeight')?.valueChanges.subscribe(() => {
      this.updatePureAndAmount();
    });

    this.transactionForm.get('touch')?.valueChanges.subscribe(() => {
      this.updatePureAndAmount();
      this.updateAmount();
    });

    this.transactionForm.get('pure')?.valueChanges.subscribe(() => {
      this.updateAmount();
    });

    this.transactionForm.get('rate')?.valueChanges.subscribe(() => {
      this.updateAmount();
    });

    this.transactionForm.get('stockName')?.valueChanges.subscribe(stockName => {
      this.updateTouchBasedOnStock(stockName);
      this.updatePureAndAmount();
      this.updateAmount();
    });
  }

  toggleFields(transactionType: string): void {
    const cashControl = this.transactionForm.get('cash');
    const netWeightControl = this.transactionForm.get('netWeight');
    const touchControl = this.transactionForm.get('touch');
    const rateControl = this.transactionForm.get('rate');
    const stockNameControl = this.transactionForm.get('stockName')

    if (transactionType === 'cash received' || transactionType === 'cash given') {
      cashControl?.setValidators([Validators.required]);
      netWeightControl?.clearValidators();
      touchControl?.clearValidators();
      rateControl?.clearValidators();
      stockNameControl?.clearValidators();

    } else if (
      transactionType === 'metal received' ||
      transactionType === 'metal given' ||
      transactionType === 'purchase' ||
      transactionType === 'sales' ||
      transactionType === 'ratecut purchase' ||
      transactionType === 'ratecut sales'
    ) {
      netWeightControl?.setValidators([Validators.required, Validators.min(0)]);
      touchControl?.setValidators([Validators.required]);
      rateControl?.setValidators([Validators.required]);
      stockNameControl?.setValidators([Validators.required]);
      cashControl?.clearValidators();
    } else {
      cashControl?.clearValidators();
      netWeightControl?.clearValidators();
      touchControl?.clearValidators();
      rateControl?.clearValidators();
    }

    cashControl?.updateValueAndValidity();
    netWeightControl?.updateValueAndValidity();
    touchControl?.updateValueAndValidity();
    rateControl?.updateValueAndValidity();
    stockNameControl?.updateValueAndValidity(); 

    // Reset and update values for better user experience
    if (cashControl && (transactionType !== 'cash received' && transactionType !== 'cash given')) {
      cashControl.setValue(0);
    }
    if (netWeightControl && touchControl && rateControl && (transactionType === 'cash received' || transactionType === 'cash given')) {
      netWeightControl.setValue(0);
      touchControl.setValue(0);
      rateControl.setValue(0);
    }
  }

  updatePureAndAmount(): void {
    const netWeight = this.transactionForm.get('netWeight')?.value;
    const touch = this.transactionForm.get('touch')?.value;
    const rate = this.transactionForm.get('rate')?.value;

    if (netWeight) {
      const pure = (netWeight * touch) / 100;
      this.transactionForm.get('pure')?.setValue(pure.toFixed(2));
    }

    if (netWeight && rate) {
      const amount = netWeight * rate;
      this.transactionForm.get('amount')?.setValue(amount.toFixed(2));
    }
  }

  updateAmount(): void {
    const netWeight = this.transactionForm.get('pure')?.value;
    const rate = this.transactionForm.get('rate')?.value;

    if (netWeight && rate) {
      const amount = netWeight * rate;
      this.transactionForm.get('amount')?.setValue(amount.toFixed(2));
    }
  }

  updateTouchBasedOnStock(stockName: string): void {
    if (stockName === 'bar') {
      this.transactionForm.get('touch')?.setValue(99.5);
    } else if (stockName === 'pcs') {
      this.transactionForm.get('touch')?.setValue(100);
    } else if (stockName === 'kachha' || stockName === 'maal') {
      this.transactionForm.get('touch')?.setValue(0.0);
    } else {
      this.transactionForm.get('touch')?.setValue(100);
    }
  }

  
    
  submit(): void {
    if (this.transactionForm.valid) {
      const formData = this.transactionForm.value;
  
      // Calculate pure and amount before sending
      const calculatedPure = (formData.netWeight * formData.touch) / 100;
      const calculatedAmount = calculatedPure * formData.rate;
  
      // Prepare the base data to send
      let dataToSend;
  
      // Conditionally include or exclude cash based on transaction type
      if (formData.transaction === 'purchase' || formData.transaction === 'sales') {
        const { cash, ...rest } = formData;
        dataToSend = {
          ...rest,
          pure: calculatedPure,
          amount: calculatedAmount
        };
      } else {
        dataToSend = {
          ...formData,
          pure: calculatedPure,
          amount: calculatedAmount
        };
      }
  
      console.log("Data to send:", dataToSend);
      
      // Send the data to the same API endpoint
      this.http.post<any>("http://localhost:8080/api/transactions", dataToSend)
        .subscribe(
          response => {
            console.log('Transaction created successfully:', response);
  
            // Trigger the next call based on transaction type
            if (formData.transaction === 'purchase') {
              console.log("Triggering cash given for:", formData.cash);
              this.triggerCashGiven(response.ledgerName, formData.cash, formData.date);
            } else if (formData.transaction === 'sales') {
              console.log("Triggering cash received for:", formData.cash);
              this.triggerCashReceived(response.ledgerName, formData.cash, formData.date);
            }
  
            // Reset the form after successful submission
            this.resetForm();
          },
          error => {
            console.error('Error creating transaction:', error);
          }
        ); 
    } else {
      this.findInvalidControlsRecursive(this.transactionForm);
    }
  }
  
  resetForm(): void {
    const today = new Date().toISOString().split('T')[0];
  
    this.transactionForm.reset({
      date: today,
      transaction: '',
      ledgerName: '',
      stockName: '',
      netWeight: 0,
      touch: 0,
      pure: 0,
      rate: 0,
      amount: 0,
      cash: 0,
      comments: ''
    });
  
    // Reapply validators and update validity
    this.toggleFields(this.transactionForm.get('transaction')?.value);
    this.updateTouchBasedOnStock(this.transactionForm.get('stockName')?.value);
    this.updatePureAndAmount(); // Ensure pure is updated after reset
  }
  
  // Method to handle cash given for purchases
  private triggerCashGiven(ledgerName: string, amount: number, date: any): void {
    const cashData = {
      date : date,
      ledgerName: ledgerName,
      cash: amount,
      transaction: 'cash given' // Specify the type for clarity
    };
  
    this.http.post<any>("http://localhost:8080/api/transactions", cashData)
      .subscribe(
        response => {
          console.log('Cash given transaction created successfully:', response);
        },
        error => {
          console.error('Error creating cash given transaction:', error);
        }
      );
  }
  
  // Method to handle cash received for sales
  private triggerCashReceived(ledgerName: string, amount: number, date: any): void {
    const cashData = {
      date : date,
      ledgerName: ledgerName,
      cash: amount,
      transaction: 'cash received' // Specify the type for clarity
    };
  
    this.http.post<any>("http://localhost:8080/api/transactions", cashData)
      .subscribe(
        response => {
          console.log('Cash received transaction created successfully:', response);
        },
        error => {
          console.error('Error creating cash received transaction:', error);
        }
      );
  }
findInvalidControlsRecursive(formToInvestigate: FormGroup | any) {
  Object.keys(formToInvestigate.controls).forEach(field => {
    const control = formToInvestigate.get(field);
    if (control instanceof FormGroup) {
      this.findInvalidControlsRecursive(control); // Recursively check nested forms
    } else if (control?.invalid) {
      console.log(`Field ${field} is invalid:`, control.errors);
    }
  });
}

  showField(fieldName: string): boolean {
    const transactionType = this.transactionForm.get('transaction')?.value;

    if (fieldName === 'cash' &&
      (transactionType === 'cash received' || transactionType === 'cash given' || transactionType === 'purchase' || transactionType === 'sales' || transactionType === 'ratecut purchase' ||
        transactionType === 'ratecut sales')) {
      return true;
    }

    if ((fieldName === 'netWeight' || fieldName === 'touch' || fieldName === 'pure' || fieldName === 'stockName') &&
      (transactionType === 'metal received' ||
        transactionType === 'metal given')) {
      return true;
    }

    if ((fieldName === 'netWeight' || fieldName === 'touch' || fieldName === 'pure' || fieldName === 'rate' || fieldName === 'amount' || fieldName === 'stockName') &&
      (transactionType === 'purchase' ||
        transactionType === 'sales' ||
        transactionType === 'ratecut purchase' ||
        transactionType === 'ratecut sales')) {
      return true;
    }

    return false;
  }
}