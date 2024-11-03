import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-party-balance',
  standalone: true,
  imports: [MatIcon, MatTableModule, ReactiveFormsModule, CommonModule, HttpClientModule],
  providers: [ApiService],
  templateUrl: './party-balance.component.html',
  styleUrls: ['./party-balance.component.scss'] // Corrected from styleUrl to styleUrls
})
export class PartyBalanceComponent implements OnInit {
  partyBalance: any[] = []; 
  displayedColumns: string[] = ['partyName', 'metalBalance', 'cashBalance'];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchBalance();
  }

  fetchBalance() {
    this.apiService.getBalances().subscribe((response: { balances: any[] }) => {
      this.partyBalance = response.balances; // Extract the balances array from the response
    });
  }
}