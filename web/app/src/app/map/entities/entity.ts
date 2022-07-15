import { Color } from "./color";


export abstract class Entity {

    id: number;
    name: String;
    color: Color;
    xCoordinate: number;
    yCoordinate: number;
    xVelocity: number;
    yVelocity: number;
    
    constructor(id: number, name: String, color: Color, xCoordinate: number, yCoordinate: number, xVelocity: number, yVelocity: number) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.xCoordinate = xCoordinate;
        this.yCoordinate = yCoordinate;
        this.xVelocity = xVelocity;
        this.yVelocity = yVelocity;
    }

    abstract draw(xOffset: number, yOffset: number, ctx: CanvasRenderingContext2D): void

}
