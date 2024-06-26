import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { VehicleInfo } from '../models/VehicleInfo';
import { InsurancePack } from '../models/InsurancePack';

export enum RiskCategory {
  LowRisk,
  MediumRisk,
  HighRisk
}

@Injectable({
  providedIn: 'root'
})
export class FleetQuoteService {

  private baseUrl = 'https://localhost:7162/api/fleetquote';

  constructor(private http: HttpClient) { }

  startSimulation(): Observable<string> {
    const url = `${this.baseUrl}/start-simulation`;
    return this.http.post<string>(url, null, { headers: { 'Content-Type': 'application/json' } })
      .pipe(catchError(this.handleError));
  }

  collectVehicleInfo(vehicleInfo: VehicleInfo): Observable<string> {
    const url = `${this.baseUrl}/collect-vehicle-info`;
    return this.http.post<string>(url, vehicleInfo, { headers: { 'Content-Type': 'application/json' } })
      .pipe(catchError(this.handleError));
  }

  calculateBaseTariff(): Observable<number> {
    const url = `${this.baseUrl}/calculate-base-tariff`;
    return this.http.get<number>(url)
      .pipe(catchError(this.handleError));
  }

  adjustTariff(baseTariff: number, marketValue: number, newValue: number): Observable<number> {
    const url = `${this.baseUrl}/adjust-tariff`;
    const body = { baseTariff, marketValue, newValue };
    return this.http.post<number>(url, body, { headers: { 'Content-Type': 'application/json' } })
      .pipe(catchError(this.handleError));
  }

  addGuaranteeCosts(adjustedTariff: number, chosenGuarantees: string[]): Observable<number> {
    const url = `${this.baseUrl}/add-guarantee-costs`;
    const body = { adjustedTariff, chosenGuarantees };
    return this.http.post<number>(url, body, { headers: { 'Content-Type': 'application/json' } })
      .pipe(catchError(this.handleError));
  }

  applyDurationCoefficient(tariffWithGuarantees: number, duration: number): Observable<number> {
    const url = `${this.baseUrl}/apply-duration-coefficient`;
    const body = { tariffWithGuarantees, duration };
    return this.http.post<number>(url, body, { headers: { 'Content-Type': 'application/json' } })
      .pipe(catchError(this.handleError));
  }

  calculateInsurancePremium(vehicleInfo: VehicleInfo): Observable<number> {
    const url = `${this.baseUrl}/calculate-insurance-premium`;
    console.log('Données envoyées à l\'API : ', vehicleInfo);
    return this.http.post<number>(url, vehicleInfo)
      .pipe(catchError(this.handleError));
  }

  displayInsurancePremium(premium: number): Observable<string> {
    const url = `${this.baseUrl}/display-insurance-premium`;
    return this.http.post<string>(url, { premium }, { headers: { 'Content-Type': 'application/json' } })
      .pipe(catchError(this.handleError));
  }

  generateContentUsingGemini(): Observable<string> {
    const url = `${this.baseUrl}/generate-content-using-gemini`;
    return this.http.post<string>(url, null, { headers: { 'Content-Type': 'application/json' } })
      .pipe(catchError(this.handleError));
  }

  showInsurancePacks(totalBonusPoints: number, riskCategory: RiskCategory): Observable<InsurancePack[]> {
    const url = `${this.baseUrl}/show-insurance-packs?totalBonusPoints=${totalBonusPoints}&riskCategory=${riskCategory}`;
    return this.http.get<InsurancePack[]>(url)
      .pipe(catchError(this.handleError));
  }

  chooseInsurancePack(packName: string): Observable<InsurancePack> {
    const url = `${this.baseUrl}/choose-insurance-pack`;
    return this.http.post<InsurancePack>(url, { packName }, { headers: { 'Content-Type': 'application/json' } })
      .pipe(catchError(this.handleError));
  }

  getInsurancePacks(totalBonusPoints: number, riskCategory: RiskCategory): Observable<InsurancePack[]> {
    return this.showInsurancePacks(totalBonusPoints, riskCategory);
  }

  processPayment(amount: number): Observable<string> {
    const url = `${this.baseUrl}/process-payment`;
    return this.http.post<string>(url, { amount }, { headers: { 'Content-Type': 'application/json' } })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur s\'est produite. Veuillez réessayer plus tard.';
    if (error.error instanceof ErrorEvent) {
      console.error('Erreur client:', error.error.message);
      errorMessage = error.error.message;
    } else {
      console.error(`Code d'erreur : ${error.status}, Message : ${JSON.stringify(error.error)}`);
      if (error.status === 400 && error.error.errors) {
        errorMessage = 'Erreurs de validation: ' + JSON.stringify(error.error.errors);
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
