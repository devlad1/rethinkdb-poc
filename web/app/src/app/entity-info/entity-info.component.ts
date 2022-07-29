import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { BehaviorSubject, map, Observable, Subject, Subscriber } from 'rxjs';
import { Message, Op } from '../map/stream_request';
import { EntityInfoStreamService } from './entity-info-stream.service';
import { EntityState } from './entity-state';

export class EntityInfoStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-entity-info',
  templateUrl: './entity-info.component.html',
  styleUrls: ['./entity-info.component.css']
})
export class EntityInfoComponent implements OnInit {

  entityFormControl = new FormControl('', [Validators.pattern(new RegExp("^[0-9]+$"))]);
  matcher = new EntityInfoStateMatcher();

  displayedColumns: string[] = ['id', 'name', 'longitude', 'latitude', 'longV', 'latV', 'shape', 'color', 'closeButton'];

  private entityInfoStreams: Map<number, Subject<Message>>
  private _data: BehaviorSubject<Map<number, EntityState>>

  get data$(): Observable<Array<EntityState>> {
    return this._data
      .pipe(map((data: Map<number, EntityState>) => [...data.values()])
      )
  }

  constructor(private entityInfoStreamService: EntityInfoStreamService) {
    this.entityInfoStreams = new Map
    this._data = new BehaviorSubject(new Map)
  }

  ngOnInit(): void { }

  onAdd() {
    let id = Number(this.entityFormControl.value)
    if (isNaN(id)) {
      console.error(`${this.entityFormControl.value} is not a number`)
      return
    }

    let e: Subject<Message> = this.entityInfoStreamService.createStream(id)
    this.entityInfoStreams.set(id, e)
    e.subscribe({
      next: (m: Message) => {
        if (m?.entity.id === 0) {
          let deadEntity = m.entity
          deadEntity.id = id
          this._data.next(this._data.value.set(id, new EntityState(deadEntity, false)))
        } else {
          this._data.next(this._data.value.set(id, new EntityState(m.entity, m.op != Op.DELETE)))
        }
      }
    })

    this.entityFormControl.setValue("")
  }

  onClear(id: number) {
    this.entityInfoStreamService.closeStream(id)
    this.entityInfoStreams.delete(id)
    this._data.value.delete(id)
    this._data.next(this._data.value)
  }
}
