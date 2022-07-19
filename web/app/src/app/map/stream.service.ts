import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Message, Point, Zoom } from './stream_request';

@Injectable({
  providedIn: 'root'
})
export class StreamService {

  private socket: WebSocket | null

  constructor() { 
    this.socket = null
  }

  startZoomStream(zoom: Zoom): Subject<Message> {
    return this.updateSocketStream(`ws://${environment.serverHost}/zoom?zoom=${JSON.stringify(zoom)}`)
  }

  startPolygonStream(polygon: Array<Point>): Subject<Message> {
    return this.updateSocketStream(`ws://${environment.serverHost}/polygon?polygon=${JSON.stringify(polygon)}`);
  }

  close(): void {
    if (this.socket) {
      this.socket.close()
    }
  }

  private updateSocketStream(url: string): Subject<Message> {
    if (this.socket) {
      this.socket.close(1000, `url close`)
    }

    const socket = new WebSocket(url)
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
}
