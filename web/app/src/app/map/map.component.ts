import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Entity } from './entities/entity';
import { StreamService } from './stream.service';
import { Message, Op, Point } from './stream_request';
import * as isects from '2d-polygon-self-intersections';
import { Subject } from 'rxjs/internal/Subject';
import { FormControl, FormGroup } from '@angular/forms';
import { Color } from './entities/color';
import { Shape } from './entities/shape';
import { ZoomService } from './zoom.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit, OnDestroy {

  readonly CLOSE_POLYGON_DISTANCE = 15

  @ViewChild('mapCanvas', { static: true })
  mapCanvas!: ElementRef<HTMLCanvasElement>;

  private mapCtx!: CanvasRenderingContext2D;
  private polygonCtx!: CanvasRenderingContext2D;
  private entities: Map<number, Entity> = new Map;
  private isDragging: boolean = false;
  private isPolygonQueryActive: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  polygonPoints: Array<Point> = new Array
  messageToUser: string = ""

  filterForm = new FormGroup({
    enabled: new FormControl(false),
    colors: new FormControl({ value: Object.values(Color), disabled: true }),
    shapes: new FormControl({ value: Object.values(Shape), disabled: true }),
  })
  colorList: string[] = Object.values(Color);
  shapeList: string[] = Object.values(Shape);

  constructor(private streamService: StreamService, public zoomService: ZoomService) { }

  ngOnInit(): void {
    this.mapCtx = MapComponent.initCanvasCtx(this.mapCanvas)
    this.polygonCtx = MapComponent.initCanvasCtx(this.mapCanvas)

    setInterval(() => this.resetAndDrawCanvas(), 16)

    this.updateZoomStream()
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

  xToLong(x: number): number {
    let result = (x * this.zoomService.currentZoom.width / this.zoomService.MAP_WIDTH) + this.zoomService.currentZoom.topLeft.longitude
    return result
  }

  yToLat(y: number): number {
    let result = -((y * this.zoomService.currentZoom.height / this.zoomService.MAP_HEIGHT) - this.zoomService.currentZoom.topLeft.latitude)
    return result
  }

  rightclick(event: MouseEvent): void {
    event.preventDefault()

    if (this.isPolygonQueryActive) {
      this.isPolygonQueryActive = false
      this.polygonPoints = new Array
      this.updateZoomStream()
      return
    }

    var polygon = this.polygonPoints.map((p: Point) => [p.longitude, p.latitude])
    let newPointLong = this.xToLong(this.relativeX(event.x))
    let newPointLat = this.yToLat(this.relativeY(event.y))
    polygon.push([newPointLong, newPointLat])
    if (isects(polygon).length > 0) {
      this.messageToUser = `Point ${newPointLong.toFixed(2)}, ${newPointLat.toFixed(2)}, self intersects`
      return
    }

    this.messageToUser = ""
    this.polygonPoints.push(new Point(newPointLong, newPointLat))

    if (this.polygonPoints.length > 2 &&
      Point.distance(new Point(this.relativeX(event.x), this.relativeY(event.y)),
        new Point(Entity.longToCanvasX(this.polygonPoints[0].longitude, this.zoomService.currentZoom, this.zoomService.MAP_WIDTH),
          Entity.latToCanvasY(this.polygonPoints[0].latitude, this.zoomService.currentZoom, this.zoomService.MAP_HEIGHT))) < this.CLOSE_POLYGON_DISTANCE) {
      this.messageToUser = `Sent polygon to server`
      this.polygonPoints.pop()
      this.polygonPoints.push(this.polygonPoints[0])
      this.isPolygonQueryActive = true
      this.updatePolygonStream()
    }
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
    if (event.which != 1) {
      return
    }
    if (this.isDragging) {
      this.zoomService.addXPixels(this.relativeX(event.x) - this.dragStartX)
      this.zoomService.addYPixels(this.relativeY(event.y) - this.dragStartY)
      this.dragStartX = this.relativeX(event.x);
      this.dragStartY = this.relativeY(event.y);
    }
  }

  stopDrag(event: MouseEvent): void {
    if (event.which != 1) {
      return
    }
    this.isDragging = false;
    this.updateZoomStream()
  }

  changeZoom(event: WheelEvent): void {
    if (this.zoomService.changeZoom(Math.sign(event.deltaY))) {
      this.updateZoomStream()
    }
  }

  updateZoomStream(): void {
    if (this.isPolygonQueryActive) {
      return
    }
    this.entities = new Map
    let colorsFilter: Color[] | undefined = undefined
    let shapesFilter: Shape[] | undefined = undefined
    if (this.filterForm.controls.colors.enabled) {
      colorsFilter = this.filterForm.controls.colors.value === null ? undefined : this.filterForm.controls.colors.value
    }
    if (this.filterForm.controls.shapes.enabled) {
      shapesFilter = this.filterForm.controls.shapes.value === null ? undefined : this.filterForm.controls.shapes.value
    }
    this.drawStream(this.streamService.startZoomStream(this.zoomService.currentZoom, colorsFilter, shapesFilter))
  }

  updatePolygonStream(): void {
    this.entities = new Map
    let colorsFilter: Color[] | undefined = undefined
    let shapesFilter: Shape[] | undefined = undefined
    if (this.filterForm.controls.colors.enabled) {
      colorsFilter = this.filterForm.controls.colors.value === null ? undefined : this.filterForm.controls.colors.value
    }
    if (this.filterForm.controls.shapes.enabled) {
      shapesFilter = this.filterForm.controls.shapes.value === null ? undefined : this.filterForm.controls.shapes.value
    }
    this.drawStream(this.streamService.startPolygonStream(this.polygonPoints, colorsFilter, shapesFilter))
  }

  drawStream(messagePublisher: Subject<Message>) {
    messagePublisher.subscribe({
      next: (m: Message) => {
        switch (m.op) {
          case Op.CREATE:
            this.entities.set(m.entity.id, m.entity); break
          case Op.UPDATE:
            this.entities.set(m.entity.id, m.entity); break
          case Op.DELETE:
            this.entities.delete(m.entity.id); break
        }
      },
      error: (err: any) => console.log(`got error ${err} while sending entities`),
      complete: () => this.streamService.close()
    });
  }

  resetAndDrawCanvas() {
    this.mapCtx.clearRect(0, 0, this.zoomService.MAP_WIDTH, this.zoomService.MAP_HEIGHT)
    this.entities.forEach((entity: Entity, _: number) => {
      Entity.draw(entity, this.zoomService.currentZoom, this.mapCtx, this.zoomService.MAP_WIDTH, this.zoomService.MAP_HEIGHT);
    })
    if (this.polygonPoints.length > 0) {
      this.polygonCtx.beginPath();
      let canvasX = Entity.longToCanvasX(this.polygonPoints[0].longitude, this.zoomService.currentZoom, this.zoomService.MAP_WIDTH)
      let canvasY = Entity.latToCanvasY(this.polygonPoints[0].latitude, this.zoomService.currentZoom, this.zoomService.MAP_HEIGHT)
      this.polygonCtx.moveTo(canvasX, canvasY)
      for (let p of this.polygonPoints) {

        canvasX = Entity.longToCanvasX(p.longitude, this.zoomService.currentZoom, this.zoomService.MAP_WIDTH)
        canvasY = Entity.latToCanvasY(p.latitude, this.zoomService.currentZoom, this.zoomService.MAP_HEIGHT)

        this.polygonCtx.lineTo(canvasX, canvasY)
        this.polygonCtx.moveTo(canvasX, canvasY)
        this.mapCtx.translate(canvasX, canvasY)
        this.mapCtx.fillText(`${p.longitude.toFixed(2)}, ${p.latitude.toFixed(2)}`, Entity.LENGTH, 0)
        this.mapCtx.translate(-canvasX, -canvasY)
      }
      this.mapCtx.strokeStyle = "#000000";
      this.polygonCtx.stroke()

    }
  }

  toggleFilters() {
    if (this.filterForm.controls.enabled.value === false) {
      this.filterForm.controls.colors.disable()
      this.filterForm.controls.shapes.disable()
    } else {
      this.filterForm.controls.colors.enable()
      this.filterForm.controls.shapes.enable()
    }
    if (this.isPolygonQueryActive) {
      this.updatePolygonStream()
    } else {
      this.updateZoomStream()
    }
  }

  updateFilters() {
    if (this.filterForm.controls.enabled.value === true) {
      if (this.isPolygonQueryActive) {
        this.updatePolygonStream()
      } else {
        this.updateZoomStream()
      }
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
