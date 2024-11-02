import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService, Transaction } from '../../services/api.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [MatIcon, MatTableModule, ReactiveFormsModule, CommonModule, HttpClientModule],
  providers: [ApiService],
  templateUrl: './ledger.component.html',
  styleUrl: './ledger.component.scss'
})
export class LedgerComponent implements OnInit {
  
  transactions: Transaction[] = []; 
  ledgerNames: string[] = ['99ba'];
  displayedColumns: string[] = [
    'transaction', 'date', 'pure', 'rate', 'cash', 'amount', 'actions'
  ];
  transactionForm!: FormGroup;

  constructor(private apiService: ApiService, private fb: FormBuilder) {
  
    
  }

  ngOnInit() {
    this.fetchLedgerNames();
  }

  fetchLedgerNames(): void {
    this.apiService.getLedgerNames().subscribe(data => {
      this.ledgerNames = data;
    });
  }

  onNameChange(event: any) {
    const selectedName = event.target.value;
    this.fetchTransactions(selectedName);
  }

  fetchTransactions(name?: string) {
    this.apiService.getTransactionsByName(name).subscribe(data => {
      this.transactions = data;
    });
  }

  editTransaction(transaction: Transaction) {
    console.log('Editing transaction:', transaction);
  }

  deleteTransaction(id: string, name: string) {
    this.apiService.deleteTransaction(id).subscribe(
      () => {
        this.fetchTransactions(name);
      }
    );
  }
}
