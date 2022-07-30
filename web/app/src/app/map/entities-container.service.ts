import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Entity } from './entities/entity';

@Injectable({
  providedIn: 'root'
})
export class EntitiesContainerService {

  private _entities: Map<number, Entity> = new Map;

  private subscribers: Map<number, Subject<void>> = new Map<number, Subject<void>>()

  constructor() { }
  
  forEach(func: (arg0: Entity) => void): void {
    this._entities.forEach(func)
  }

  clear() {
    this._entities.clear()
    this.informSubscribers()
  }

  set(entity: Entity) {
    this._entities.set(entity.id, entity)
    this.informSubscribers()
  }

  delete(entity: Entity) {
    this._entities.delete(entity.id)
    this.informSubscribers()
  }

  size(): number {
    return this._entities.size
  }

  waitForValue(size: number): Observable<void> {
    if (size === this._entities.size) {
      throw Error(`can't wait for value ${size} because it's already there`)
    }

    let ret: Subject<void> 

    let existingSubscriber = this.subscribers.get(size)
    if (existingSubscriber === undefined) {
      ret = new Subject<void>()
      this.subscribers.set(size, ret)
    } else {
      ret = existingSubscriber
    }

    return ret.asObservable()
  }

  private informSubscribers() {
    let existingSubscriber = this.subscribers.get(this._entities.size)
    if (existingSubscriber !== undefined) {
      existingSubscriber.next()
      this.subscribers.delete(this._entities.size)
    }
  }

}
