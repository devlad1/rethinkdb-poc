import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Message } from '../map/stream_request';

@Injectable({
  providedIn: 'root'
})
export class EntityInfoStreamService {

  private socketMap: Map<number, WebSocket>

  constructor() { 
    this.socketMap = new Map
  }

  createStream(id: number): Subject<Message> {
    const socket = new WebSocket(`ws://${environment.serverHost}/entity?id=${id}`)
    let subject = new Subject<Message>()

    socket.addEventListener('open', function (_) {});

    socket.addEventListener('message', function (event: MessageEvent<any>) {
      let m: Message = JSON.parse(event.data)
      subject.next(m)
    });

    socket.addEventListener('close', function (event: CloseEvent) {
      console.log(`got close event ${event.reason}`)
    });

    this.socketMap.set(id, socket)

    return subject
  }

  closeStream(id: number) {
    if (this.socketMap.has(id)) {
      this.socketMap.get(id)?.close()
      this.socketMap.delete(id)
    }
  }
}
