import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Transaction {
  id?: string;           // Optional: might not be available for new transactions
  date: string;
  transaction: string;
  ledgerName: string;
  stockName?: string;    // Optional
  netWeight?: number;    // Optional
  touch?: number;        // Optional
  rate?: number; 
  pure?: number;         // Optional
  cash?: number;  
  amount?: number;       // Optional
  comments?: string;     // Optional
}

@Component({
  selector: 'app-daybook',
  templateUrl: './daybook.component.html',
  styleUrls: ['./daybook.component.scss'],  // Fixed the property name to 'styleUrls'
  imports: [MatIcon, MatTableModule, ReactiveFormsModule,CommonModule, HttpClientModule],
  standalone: true
})
export class DaybookComponent implements OnInit {
  
  transactions: Transaction[] = []; 
  displayedColumns: string[] = [
    'transaction', 'ledgerName', 'pure', 'rate', 'cash','amount', 'actions'
  ];
  transactionForm: FormGroup; // Declare the FormGroup

  constructor(private http: HttpClient, private fb: FormBuilder) {
    // Initialize the FormGroup
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];
    this.transactionForm = this.fb.group({
      date: [todayDate], // Initialize the date field
    });
  }

  ngOnInit() {
    this.fetchTransactions(); // Fetch transactions on component initialization
  }

  onDateChange(event: any) {
    const selectedDate = event.target.value;
    this.fetchTransactions(selectedDate); // Fetch transactions for the selected date
  }

  fetchTransactions(date?: string) {
    const url = 'http://localhost:8080/api/transactions';
    let params = new HttpParams();

    // If date is provided, add it as a query parameter
    if (date) {
      params = params.append('date', date);
    } else {
      const today = new Date();
    const todayDate = today.toISOString().split('T')[0];
      // If no date is provided, default to today's date
    // Format YYYY-MM-DD
      params = params.append('date', todayDate);
    }

    // Use the params in your HTTP request
    this.http.get<Transaction[]>(url, { params })
      .subscribe(data => {
        this.transactions = data; // Update the transactions array with fetched data
      });
  }

  editTransaction(transaction: Transaction) {
    // Implement your edit logic here.
    console.log('Editing transaction:', transaction);
  }
  deleteTransaction(id: string,date :string) {
    const url = 'http://localhost:8080/api/transactions';
    let params = new HttpParams();
    params = params.append('id', id);
    this.http.delete(url, { params: params }).subscribe(
      () => {this.fetchTransactions(date)}
    );

    console.log('Deleting transaction with ID:', id);
  }

}