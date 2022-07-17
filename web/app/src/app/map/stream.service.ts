import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Message, Zoom } from './stream_request';

@Injectable({
  providedIn: 'root'
})
export class StreamService {

  private socket: WebSocket | null

  constructor() { 
    this.socket = null
  }

  start(zoom: Zoom): Subject<Message> {
    if (this.socket) {
      this.socket.close(1000, "new zoom")
    }

    const socket = new WebSocket(`ws://${environment.serverHost}/zoom?zoom=${JSON.stringify(zoom)}`)
    let subject = new Subject<Message>()

    socket.addEventListener('open', function (_) {});

    socket.addEventListener('message', function (event: MessageEvent<any>) {
      let m: Message = JSON.parse(event.data)
      subject.next(m)
    });

    socket.addEventListener('close', function (event: CloseEvent) {
      console.log(`got close event ${event.reason}`)
    });

    this.socket = socket

    return subject
  }

  close(): void {
    if (this.socket) {
      this.socket.close()
    }
  }

}
