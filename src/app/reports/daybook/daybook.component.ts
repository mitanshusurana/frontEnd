
import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService, Transaction } from '../../services/api.service';

@Component({
  selector: 'app-daybook',
  templateUrl: './daybook.component.html',
  styleUrls: ['./daybook.component.scss'],
  imports: [MatIcon, MatTableModule, ReactiveFormsModule, CommonModule],
  standalone: true
})
export class DaybookComponent implements OnInit {
  
  transactions: Transaction[] = []; 
  displayedColumns: string[] = [
    'transaction', 'ledgerName', 'pure', 'rate', 'cash', 'amount', 'actions'
  ];
  transactionForm: FormGroup;

  constructor(private apiService: ApiService, private fb: FormBuilder) {
    const today = new Date().toISOString().split('T')[0];
    this.transactionForm = this.fb.group({
      date: [today],
    });
  }

  ngOnInit() {
    this.fetchTransactions();
  }

  onDateChange(event: any) {
    const selectedDate = event.target.value;
    this.fetchTransactions(selectedDate);
  }

  fetchTransactions(date?: string) {
    this.apiService.getTransactions(date).subscribe(data => {
      this.transactions = data;
    });
  }

  editTransaction(transaction: Transaction) {
    console.log('Editing transaction:', transaction);
  }

  deleteTransaction(id: string, date: string) {
    this.apiService.deleteTransaction(id).subscribe(
      () => {
        this.fetchTransactions(date);
      }
    );
  }
}
