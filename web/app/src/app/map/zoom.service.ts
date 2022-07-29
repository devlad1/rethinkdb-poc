import { Injectable } from '@angular/core';
import { Point, Zoom } from './stream_request';

@Injectable({
  providedIn: 'root'
})
export class ZoomService {

  readonly MAP_WIDTH = 1000
  readonly MAP_HEIGHT = 500

  private readonly initialTopLat = 3
  private readonly initialLeftLong = 0
  private readonly initialButtomLat = 0
  private readonly initialRightLong = (this.MAP_WIDTH / this.MAP_HEIGHT) * (this.initialTopLat - this.initialButtomLat) - this.initialLeftLong
  zoom: Zoom = new Zoom(new Point(this.initialLeftLong, this.initialTopLat), new Point(this.initialRightLong, this.initialButtomLat))

  constructor() {}

  get currentZoom(): Zoom {
    return this.zoom
  }

  addXPixels(diff: number) {
    this.zoom.addLong(-diff * (this.zoom.width / this.MAP_WIDTH))
  }

  addYPixels(diff: number) {
    this.zoom.addLat(diff * (this.zoom.height / this.MAP_HEIGHT))
  }

  changeZoom(sign: number): boolean {
    let yDiff = -Math.sign(sign) * this.zoom.height / 10
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
      return true
    }
    return false
  }
  
}
