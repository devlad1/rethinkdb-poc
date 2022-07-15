import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Circle } from './entities/circle';
import { Color } from './entities/color';
import { Constants } from './entities/contants';
import { Entity } from './entities/entity';
import { Square } from './entities/square';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {

  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;  
  
  private ctx!: CanvasRenderingContext2D;

  readonly MAP_WIDTH = 1000;
  readonly MAP_HEIGHT = 800;

  private entities: Map<number, Entity>;
  private xOffset: number = 0;
  private yOffset: number = 0;

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  constructor() {
    this.entities = new Map;
    this.entities.set(1, new Square(1, "test", Color.RED, 10, 71, 1, 1))
    this.entities.set(2, new Square(1, "test", Color.BLACK, 20, 61, 2, 1))
    this.entities.set(3, new Square(1, "test", Color.GREEN, 30, 51, 1, 1))
    this.entities.set(4, new Square(1, "test", Color.BLUE, 40, 31, 3, 1))
    this.entities.set(5, new Square(1, "test", Color.RED, 50, 21, 1, 1))
    this.entities.set(6, new Square(1, "test", Color.RED, 60, 101, 4, 1))
    this.entities.set(7, new Square(1, "test", Color.RED, 70, 11, 1, 1))
    this.entities.set(8, new Square(1, "test", Color.RED, 90, 41, 1, 1))
    this.entities.set(9, new Square(1, "test", Color.RED, 170, 15, 1, 1))
    this.entities.set(10, new Square(1, "test", Color.RED, -70, 111, 1, 1))
    this.entities.set(11, new Circle(1, "test", Color.RED, 110, 71, 1, 1))
    this.entities.set(12, new Circle(1, "test", Color.BLACK, 120, 61, 2, 1))
    this.entities.set(13, new Circle(1, "test", Color.GREEN, 130, 51, 1, 1))
    this.entities.set(14, new Circle(1, "test", Color.BLUE, 140, 31, 3, 1))
    this.entities.set(15, new Circle(1, "test", Color.RED, 150, 21, 1, 1))
    this.entities.set(16, new Circle(1, "test", Color.RED, 160, 101, 4, 1))
    this.entities.set(17, new Circle(1, "test", Color.RED, 170, 11, 1, 1))
    this.entities.set(18, new Circle(1, "test", Color.RED, 190, 41, 1, 1))
    this.entities.set(19, new Circle(1, "test", Color.RED, 1170, 15, 1, 1))
    this.entities.set(20, new Circle(1, "test", Color.RED, -170, 111, 1, 1))
  }

  ngOnInit(): void {
    let ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx != null) {
      this.ctx = ctx;
    } else {
      throw new Error("failed canvas")
    }
  }

  startDrag(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.x;
    this.dragStartY = event.y;
  }

  moveDrag(event: MouseEvent): void {
    if(this.isDragging) {
      this.xOffset += (event.x - this.dragStartX)
      this.yOffset += (event.y - this.dragStartY)
      this.dragStartX = event.x;
      this.dragStartY = event.y;
      this.animate()
    }
  }

  stopDrag(_: MouseEvent): void {
    this.isDragging = false;
  }

  animate(): void {
    this.ctx.clearRect(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT)
    this.entities.forEach((entity: Entity, _: number) => {
      entity.draw(this.xOffset, this.yOffset, this.ctx);
    })
  }

}
