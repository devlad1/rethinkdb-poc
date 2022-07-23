import { Zoom } from "../stream_request";
import { Color } from "./color";
import { Shape } from "./shape";


export class Entity {

    static readonly LENGTH: number = 20;

    id: number;
    name: String;
    color: Color;
    shape: Shape;
    longitude: number;
    latitude: number;
    longV: number;
    latV: number;

    constructor(id: number, name: String, color: Color, shape: Shape, longitude: number, latitude: number, longV: number, latV: number) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.shape = shape;
        this.longitude = longitude;
        this.latitude = latitude;
        this.longV = longV;
        this.latV = latV;
    }

    static longToCanvasX(longitude: number, zoom: Zoom, canvasWidth: number): number {
        return (-zoom.topLeft.longitude + longitude) * (canvasWidth / zoom.width)
    }

    static latToCanvasY(latitude: number, zoom: Zoom, canvasHeight: number): number {
        return -(-zoom.topLeft.latitude + latitude) * (canvasHeight / zoom.height)
    }

    static draw(entity: Entity, zoom: Zoom, ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
        let entityCenterX = Entity.longToCanvasX(entity.longitude, zoom, canvasWidth)
        let entityCenterY = Entity.latToCanvasY(entity.latitude, zoom, canvasHeight)
        let angle = Math.abs(Math.atan(entity.latV / entity.longV))
        if (entity.longV < 0 && entity.latV > 0) {
            angle = Math.PI - angle
        }
        if (entity.longV < 0 && entity.latV < 0) {
            angle += Math.PI
        }
        if (entity.longV > 0 && entity.latV < 0) {
            angle = 2 * Math.PI - angle
        }

        ctx.strokeStyle = `#${entity.color}`;

        let initialTransform = ctx.getTransform()
        ctx.translate(entityCenterX, entityCenterY)
        ctx.fillText(`${entity.id}`, Entity.LENGTH, -10)
        ctx.fillText(`${entity.longitude.toFixed(2)}, ${entity.latitude.toFixed(2)}`, Entity.LENGTH, 0)
        ctx.fillText(`${entity.longV.toFixed(2)}, ${entity.latV.toFixed(2)}`, Entity.LENGTH, 10)
        ctx.rotate(-angle)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Entity.LENGTH, 0);

        switch (entity.shape) {
            case Shape.CIRCLE: {
                ctx.arc(0, 0, Entity.LENGTH / 2, 0, 2 * Math.PI)
                ctx.stroke();
                break
            }
            case Shape.SQUARE: {
                ctx.stroke();
                ctx.strokeRect(- Entity.LENGTH / 2, - Entity.LENGTH / 2, Entity.LENGTH, Entity.LENGTH);
                break
            }
        }
        ctx.setTransform(initialTransform)
    }

}
