import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Zoom } from '../map/stream_request';

@Injectable({
  providedIn: 'root'
})
export class GeneratorService {

  BASE_GENERATOR_URL = `http://${environment.generatorHost}`

  constructor(private http: HttpClient) { }

  sendSetEntitiesRequest(numEntities: number | null): Observable<Object> {
    return this.http.post(`${this.BASE_GENERATOR_URL}/entities?n=${numEntities}`, '')
  }

  sendSetRateRequest(rate: number | null): Observable<Object> {
    return this.http.post(`${this.BASE_GENERATOR_URL}/rate?n=${rate}`, '')
  }

  sendClearAllEntitiesRequest(): Observable<Object> {
    return this.http.post(`${this.BASE_GENERATOR_URL}/clearall`, '')
  }

  sendStartRandomRequest(): Observable<Object> {
    return this.http.post(`${this.BASE_GENERATOR_URL}/start`, '')
  }

  sendStopRandomRequest(): Observable<Object> {
    return this.http.post(`${this.BASE_GENERATOR_URL}/stop`, '')
  }

  sendSendNEntitiesRequest(numEntities: number | null, zoom: Zoom): Observable<Object> {
    return this.http.post(`${this.BASE_GENERATOR_URL}/send?n=${numEntities}`, JSON.stringify(zoom))
  }
}
