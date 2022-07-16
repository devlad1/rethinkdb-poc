import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Color } from './entities/color';
import { Entity } from './entities/entity';
import { Shape } from './entities/shape';
import { StreamService } from './stream.service';
import { Message, Op, Point, Zoom } from './stream_request';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit, OnDestroy {

  readonly MAP_WIDTH = 1000;
  readonly MAP_HEIGHT = 500;

  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  readonly initialTopLat = 3
  readonly initialLeftLong = 0
  readonly initialButtomLat = 0
  readonly initialRightLong = (this.MAP_WIDTH / this.MAP_HEIGHT) * (this.initialTopLat - this.initialButtomLat) - this.initialLeftLong
  zoom: Zoom = new Zoom(new Point(this.initialLeftLong, this.initialTopLat), new Point(this.initialRightLong, this.initialButtomLat))

  private ctx!: CanvasRenderingContext2D;
  private entities: Map<number, Entity> = new Map;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  constructor(private streamService: StreamService) {
    // this.entities.set(1, new Entity(1, "test", Color.RED, Shape.SQUARE, 0.5, 0.5, 1, 0))
    // this.entities.set(20, new Entity(20, "test", Color.RED, Shape.CIRCLE, 1, 1, 1, 1))
  }

  ngOnInit(): void {
    let ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx != null) {
      this.ctx = ctx;
    } else {
      throw new Error("failed canvas")
    }
  }

  ngOnDestroy(): void {
    this.streamService.close()
  }

  startDrag(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.x;
    this.dragStartY = event.y;

    // this.ctx.clearRect(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT)
    // this.entities.forEach((entity: Entity, _: number) => {
    //   console.log(entity)
    //   Entity.draw(entity, this.zoom, this.ctx, this.MAP_WIDTH, this.MAP_HEIGHT);
    // })
  }

  moveDrag(event: MouseEvent): void {
    if (this.isDragging) {
      this.zoom.addLong(-(event.x - this.dragStartX) * (this.zoom.width / this.MAP_WIDTH))
      this.zoom.addLat((event.y - this.dragStartY) * (this.zoom.height / this.MAP_HEIGHT))
      this.dragStartX = event.x;
      this.dragStartY = event.y;
      this.animate()
    }
  }

  stopDrag(_: MouseEvent): void {
    this.isDragging = false;
  }

  changeZoom(event: WheelEvent): void {
    let yDiff = -Math.sign(event.deltaY) * this.zoom.height / 5
    let xDiff = yDiff * (this.MAP_WIDTH / this.MAP_HEIGHT)
    if (this.zoom.topLeft.longitude + xDiff < Zoom.MAX_LONG && this.zoom.topLeft.longitude + xDiff > -Zoom.MAX_LONG &&
      this.zoom.topLeft.latitude - yDiff < Zoom.MAX_LAT && this.zoom.topLeft.latitude - yDiff > -Zoom.MAX_LAT &&
      this.zoom.buttomRight.longitude - xDiff < Zoom.MAX_LONG && this.zoom.buttomRight.longitude - xDiff > -Zoom.MAX_LONG &&
      this.zoom.buttomRight.latitude + xDiff < Zoom.MAX_LAT && this.zoom.buttomRight.latitude + xDiff > -Zoom.MAX_LAT) {
      this.zoom.topLeft.longitude += xDiff
      this.zoom.topLeft.latitude += -yDiff
      this.zoom.buttomRight.longitude += -xDiff
      this.zoom.buttomRight.latitude += yDiff
      this.animate()
    }
  }

  animate(): void {

    this.streamService.start(this.zoom).subscribe({
      next: (m: Message) => {
        switch (m.op) {
          case Op.CREATE:
            this.entities.set(m.entity.id, m.entity); break
          case Op.UPDATE:
            this.entities.set(m.entity.id, m.entity); break
          case Op.DELETE:
            this.entities.delete(m.entity.id); break
        }
        this.ctx.clearRect(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT)
        this.entities.forEach((entity: Entity, _: number) => {
          console.log(entity)
          Entity.draw(entity, this.zoom, this.ctx, this.MAP_WIDTH, this.MAP_HEIGHT);
        })
      },
    });
  }

}
