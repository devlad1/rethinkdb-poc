import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Entity } from './entities/entity';
import { StreamService } from './stream.service';
import { Message, Op, Point, Zoom } from './stream_request';
import { Queue } from 'queue-typescript';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit, OnDestroy {  
  readonly MAP_WIDTH = 1000;
  readonly MAP_HEIGHT = 500;

  @ViewChild('mapCanvas', { static: true })
  mapCanvas!: ElementRef<HTMLCanvasElement>;

  readonly initialTopLat = 3
  readonly initialLeftLong = 0
  readonly initialButtomLat = 0
  readonly initialRightLong = (this.MAP_WIDTH / this.MAP_HEIGHT) * (this.initialTopLat - this.initialButtomLat) - this.initialLeftLong
  zoom: Zoom = new Zoom(new Point(this.initialLeftLong, this.initialTopLat), new Point(this.initialRightLong, this.initialButtomLat))

  private mapCtx!: CanvasRenderingContext2D;
  private polygonCtx!: CanvasRenderingContext2D;
  private entities: Map<number, Entity> = new Map;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  messages: Queue<Message> = new Queue
  polygonPoints: Array<Point> = new Array
  mousePos: Point = new Point(0,0)

  constructor(private streamService: StreamService) {}

  ngOnInit(): void {
    this.mapCtx = MapComponent.initCanvasCtx(this.mapCanvas)
    this.polygonCtx = MapComponent.initCanvasCtx(this.mapCanvas)
    this.animate()
  }

  ngOnDestroy(): void {
    this.streamService.close()
  }

  relativeX(x: number): number {
    return x - this.mapCanvas.nativeElement.getBoundingClientRect().x
  }

  relativeY(y: number): number {
    return y - this.mapCanvas.nativeElement.getBoundingClientRect().y
  }

  // xToLong(x: number): number {

  // }

  rightclick(event: MouseEvent): boolean {
    this.polygonPoints.push(new Point(this.relativeX(event.x), this.relativeY(event.y)))
    this.drawSelectionPolygon()
    return false
  }

  startDrag(event: MouseEvent): void {
    if (event.which != 1) {
      return
    }
    this.isDragging = true;
    this.dragStartX = this.relativeX(event.x);
    this.dragStartY = this.relativeY(event.y);
  }

  moveDrag(event: MouseEvent): void {
    console.log(JSON.stringify(this.mapCanvas.nativeElement.getBoundingClientRect()))
    if (event.which != 1) {
      return
    }
    if (this.isDragging) {
      this.zoom.addLong(-(this.relativeX(event.x) - this.dragStartX) * (this.zoom.width / this.MAP_WIDTH))
      this.zoom.addLat((this.relativeY(event.y) - this.dragStartY) * (this.zoom.height / this.MAP_HEIGHT))
      this.dragStartX = this.relativeX(event.x);
      this.dragStartY = this.relativeY(event.y);
    }
  }

  stopDrag(event: MouseEvent): void {
    if (event.which != 1) {
      return
    }
    this.isDragging = false;
    this.animate()
  }

  changeZoom(event: WheelEvent): void {
    let yDiff = -Math.sign(event.deltaY) * this.zoom.height / 10
    let xDiff = yDiff * (this.MAP_WIDTH / this.MAP_HEIGHT)
    let newTopLeft: Point = new Point(this.zoom.topLeft.longitude + xDiff, this.zoom.topLeft.latitude - yDiff)
    let newButtomRight: Point = new Point(this.zoom.buttomRight.longitude - xDiff, this.zoom.buttomRight.latitude + xDiff)
    if (newTopLeft.longitude < Zoom.MAX_LONG && newTopLeft.longitude > -Zoom.MAX_LONG &&
      newTopLeft.latitude < Zoom.MAX_LAT && newTopLeft.latitude > -Zoom.MAX_LAT &&
      newButtomRight.longitude < Zoom.MAX_LONG && newButtomRight.longitude > -Zoom.MAX_LONG &&
      newButtomRight.latitude < Zoom.MAX_LAT && newButtomRight.latitude > -Zoom.MAX_LAT &&
      Point.distance(newTopLeft, newButtomRight) < Zoom.MAX_DIAG_LEN &&
      Point.distance(newTopLeft, newButtomRight) > Zoom.MIN_DIAG_LEN) {
      this.zoom.topLeft = newTopLeft
      this.zoom.buttomRight = newButtomRight
      this.animate()
    }
  }

  animate(): void {
    this.entities = new Map
    this.messages = new Queue
    this.streamService.start(this.zoom).subscribe({
      next: (m: Message) => {
        this.messages.enqueue(m)
        if (this.messages.length > 10) {
          this.messages.dequeue()
        }
        switch (m.op) {
          case Op.CREATE:
            this.entities.set(m.entity.id, m.entity); break
          case Op.UPDATE:
            this.entities.set(m.entity.id, m.entity); break
          case Op.DELETE:
            this.entities.delete(m.entity.id); break
        }
        this.mapCtx.clearRect(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT)
        this.drawSelectionPolygon()
        this.entities.forEach((entity: Entity, _: number) => {
          Entity.draw(entity, this.zoom, this.mapCtx, this.MAP_WIDTH, this.MAP_HEIGHT);
        })
      },
    });
  }

  drawSelectionPolygon() {
    if (this.polygonPoints.length > 0) {
      this.polygonCtx.beginPath();
      this.polygonCtx.moveTo(this.polygonPoints[0].longitude, this.polygonPoints[0].latitude)
      for (let p of this.polygonPoints) {
        this.polygonCtx.lineTo(p.longitude, p.latitude)
        this.polygonCtx.moveTo(p.longitude, p.latitude)
      }
      this.mapCtx.strokeStyle = "#000000";
      this.polygonCtx.stroke()
    }
  }

  static initCanvasCtx(canvas: ElementRef<HTMLCanvasElement>): CanvasRenderingContext2D {
    let ctx = canvas.nativeElement.getContext('2d');
    if (ctx != null) {
      return ctx
    } else {
      throw new Error("failed canvas")
    }
  }

}
