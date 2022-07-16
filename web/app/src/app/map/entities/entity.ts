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

    static draw(entity: Entity, zoom: Zoom, ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
        let entityCenterX = (-zoom.topLeft.longitude + entity.longitude) * (canvasWidth / zoom.width);
        let entityCenterY = -(-zoom.topLeft.latitude + entity.latitude) * (canvasHeight / zoom.height);
        let angle = Math.asin(entity.latV / -entity.longV)

        ctx.strokeStyle = entity.color;

        let initialTransform = ctx.getTransform()
        ctx.translate(entityCenterX, entityCenterY)
        ctx.rotate(angle)
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
